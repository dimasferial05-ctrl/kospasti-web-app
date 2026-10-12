import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
        room_type: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (booking.user_id !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Anda tidak memiliki izin untuk membatalkan pesanan ini.",
        },
        { status: 403 }
      );
    }

    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
      return NextResponse.json(
        {
          success: false,
          error: "Pesanan ini sudah dibatalkan atau dikembalikan sebelumnya.",
        },
        { status: 400 }
      );
    }

    if (booking.status === "REFUND_REQUESTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Pengajuan pengembalian dana untuk pesanan ini sedang dalam proses.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason, bankName, accountNumber, accountHolder } = body;

    // Alur 1: Pesanan belum dibayar (PENDING) -> Langsung CANCELLED
    if (booking.status === "PENDING") {
      const cancellationReason = reason?.trim() || "Dibatalkan oleh penyewa";

      const updated = await prisma.$transaction(async (tx) => {
        // Kembalikan kuota kamar
        await tx.property.update({
          where: { id: booking.property_id },
          data: { available_rooms: { increment: 1 } },
        });

        if (booking.room_type_id) {
          await tx.roomType.update({
            where: { id: booking.room_type_id },
            data: { available_rooms: { increment: 1 } },
          });
        }

        // Invalidate magic link verifikasi yang belum terpakai
        await tx.magicLink.updateMany({
          where: {
            booking_id: booking.id,
            is_used: false,
          },
          data: {
            is_used: true,
          },
        });

        return await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancellation_reason: cancellationReason,
          },
        });
      });

      return NextResponse.json(
        {
          success: true,
          message: "Pesanan berhasil dibatalkan.",
          data: updated,
        },
        { status: 200 }
      );
    }

    // Alur 2: Pesanan sudah dibayar / disetujui (PAID / APPROVED / ACCEPTED) -> REFUND_REQUESTED
    if (
      booking.status === "PAID" ||
      booking.status === "APPROVED" ||
      booking.status === "ACCEPTED"
    ) {
      if (
        !reason?.trim() ||
        !bankName?.trim() ||
        !accountNumber?.trim() ||
        !accountHolder?.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Mohon lengkapi seluruh formulir pengembalian dana: alasan pembatalan, nama bank/e-wallet, nomor rekening, dan nama pemilik rekening.",
          },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Kembalikan kuota kamar secara real-time ke sistem
        await tx.property.update({
          where: { id: booking.property_id },
          data: { available_rooms: { increment: 1 } },
        });

        if (booking.room_type_id) {
          await tx.roomType.update({
            where: { id: booking.room_type_id },
            data: { available_rooms: { increment: 1 } },
          });
        }

        // Invalidate magic links
        await tx.magicLink.updateMany({
          where: {
            booking_id: booking.id,
            is_used: false,
          },
          data: {
            is_used: true,
          },
        });

        return await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "REFUND_REQUESTED",
            cancellation_reason: reason.trim(),
            refund_bank_name: bankName.trim(),
            refund_account_number: accountNumber.trim(),
            refund_account_holder: accountHolder.trim(),
          },
        });
      });

      return NextResponse.json(
        {
          success: true,
          message:
            "Pengajuan pembatalan dan pengembalian dana berhasil diajukan.",
          data: updated,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Pesanan dengan status ${booking.status} tidak dapat dibatalkan.`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gagal membatalkan pesanan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat membatalkan pesanan.",
      },
      { status: 500 }
    );
  }
}
