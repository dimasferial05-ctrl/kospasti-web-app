import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyDepositReleased } from "@/lib/notifications";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        room_type: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan booking dimiliki oleh mitra yang sedang login (Anti-IDOR)
    if (booking.property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak memiliki akses ke pesanan ini." },
        { status: 403 }
      );
    }

    // Validasi apakah kamar sudah dicheckout sebelumnya
    if (booking.checkout_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Kamar pada pesanan ini sudah dikonfirmasi checkout sebelumnya." },
        { status: 400 }
      );
    }

    // Hanya pesanan yang sudah check-in yang dapat diproses checkout
    const validStatuses = ["COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"];
    if (!validStatuses.includes(booking.status) && !booking.checkin_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: `Status booking belum dapat diproses checkout (${booking.status}). Pesanan harus sudah melalui tahap check-in terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const condition = body?.condition === "DAMAGED" ? "DAMAGED" : "GOOD";
    const depositTotal = booking.security_deposit || 0;

    let claimedAmount = 0;
    let claimReason: string | null = null;

    if (condition === "DAMAGED") {
      const rawClaim = Number(body?.claimAmount);
      if (isNaN(rawClaim) || rawClaim <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Nominal klaim kerusakan harus berupa angka positif lebih dari 0.",
          },
          { status: 400 }
        );
      }

      if (rawClaim > depositTotal) {
        return NextResponse.json(
          {
            success: false,
            error: `Nominal klaim (Rp${rawClaim.toLocaleString("id-ID")}) tidak boleh melebihi uang deposit jaminan (Rp${depositTotal.toLocaleString("id-ID")}).`,
          },
          { status: 400 }
        );
      }

      const rawReason = typeof body?.claimReason === "string" ? body.claimReason.trim() : "";
      if (!rawReason || rawReason.length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Alasan klaim kerusakan fasilitas wajib diisi minimal 3 karakter.",
          },
          { status: 400 }
        );
      }

      claimedAmount = Math.floor(rawClaim);
      claimReason = rawReason;
    }

    const refundedAmount = Math.max(0, depositTotal - claimedAmount);
    let finalDepositStatus: string;
    if (depositTotal === 0) {
      finalDepositStatus = "NONE";
    } else if (claimedAmount === 0) {
      finalDepositStatus = "REFUNDED";
    } else {
      finalDepositStatus = "CLAIMED";
    }

    const now = new Date();

    // Jalankan pembaruan data secara atomik
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          checkout_confirmed_at: now,
          deposit_status: finalDepositStatus,
          deposit_claimed_amount: claimedAmount,
          deposit_claim_reason: claimReason,
          deposit_refunded_at: depositTotal > 0 ? now : null,
        },
      });

      // Kembalikan ketersediaan kamar karena penyewa telah resmi keluar (+1)
      if (booking.room_type_id) {
        await tx.roomType.update({
          where: { id: booking.room_type_id },
          data: {
            available_rooms: { increment: 1 },
          },
        });
      }

      await tx.property.update({
        where: { id: booking.property_id },
        data: {
          available_rooms: { increment: 1 },
        },
      });

      return updated;
    });

    // Kirim notifikasi In-App & WA ke Mahasiswa
    if (depositTotal > 0) {
      await notifyDepositReleased({
        tenantName: booking.student_name,
        tenantWhatsapp: booking.student_whatsapp,
        propertyName: booking.property.name,
        depositAmount: depositTotal,
        refundedAmount,
        claimedAmount,
        claimReason,
        userId: booking.user_id,
        bookingId: booking.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Checkout kamar dan pelepasan deposit jaminan berhasil diproses.",
        data: {
          booking: updatedBooking,
          depositTotal,
          refundedAmount,
          claimedAmount,
          depositStatus: finalDepositStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memproses checkout kamar:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memproses checkout kamar." },
      { status: 500 }
    );
  }
}
