import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const ALLOWED_STATUSES = ["PENDING", "SUCCESS", "CONFIRMED", "APPROVED", "REJECTED", "CANCELLED", "REFUND_REQUESTED", "REFUNDED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID booking diperlukan.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.status || typeof body.status !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Payload status diperlukan.",
        },
        {
          status: 400,
        }
      );
    }

    const status = body.status.trim().toUpperCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status '${body.status}' tidak valid. Status yang diizinkan: ${ALLOWED_STATUSES.join(", ")}`,
        },
        {
          status: 400,
        }
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updateData: {
        status: string;
        refunded_at?: Date;
        refund_note?: string;
      } = {
        status: status,
      };

      if (status === "REFUNDED") {
        updateData.refunded_at = new Date();
        if (body.refund_note && typeof body.refund_note === "string") {
          updateData.refund_note = body.refund_note.trim();
        }
      }

      const updated = await tx.booking.update({
        where: { id: id.trim() },
        data: updateData,
        include: {
          property: {
            select: {
              name: true,
            },
          },
        },
      });

      const isOldActive = ["PENDING", "SUCCESS", "CONFIRMED", "APPROVED"].includes(existingBooking.status);
      const isNewActive = ["PENDING", "SUCCESS", "CONFIRMED", "APPROVED"].includes(status);

      if (isOldActive && !isNewActive && existingBooking.property_id) {
        await tx.property.update({
          where: { id: existingBooking.property_id },
          data: {
            available_rooms: { increment: 1 },
          },
        });
        if (existingBooking.room_type_id) {
          await tx.roomType.update({
            where: { id: existingBooking.room_type_id },
            data: { available_rooms: { increment: 1 } },
          });
        }
      } else if (!isOldActive && isNewActive && existingBooking.property_id) {
        await tx.property.update({
          where: { id: existingBooking.property_id },
          data: {
            available_rooms: { decrement: 1 },
          },
        });
        if (existingBooking.room_type_id) {
          await tx.roomType.update({
            where: { id: existingBooking.room_type_id },
            data: { available_rooms: { decrement: 1 } },
          });
        }
      }

      return updated;
    });

    // Kirim notifikasi WhatsApp dari Admin KosPasti jika status adalah REFUNDED
    if (status === "REFUNDED" && existingBooking.student_whatsapp) {
      const propertyName = existingBooking.property?.name || "Kos";
      const refundNoteText = body.refund_note ? `\n\nCatatan / No. Referensi Transfer: *${body.refund_note.trim()}*` : "";
      const refundMessage = [
        `Halo *${existingBooking.student_name}*,`,
        ``,
        `Pengembalian dana (*refund*) untuk pesanan kamar Anda di *${propertyName}* telah selesai ditransfer oleh Tim Admin Finansial KosPasti.${refundNoteText}`,
        ``,
        `📋 *Tujuan Pengembalian Dana:*`,
        `🏦 *Bank / E-Wallet:* ${existingBooking.refund_bank_name || "-"}`,
        `💳 *No. Rekening / Akun:* ${existingBooking.refund_account_number || "-"}`,
        `👤 *Atas Nama:* ${existingBooking.refund_account_holder || "-"}`,
        ``,
        `Silakan periksa mutasi saldo pada rekening Anda. Terima kasih telah mempercayai layanan *KosPasti*.`,
        ``,
        `_Salam hangat, Tim KosPasti._`,
      ].join("\n");

      await sendWhatsAppMessage({
        to: existingBooking.student_whatsapp,
        message: refundMessage,
      }).catch((err) => console.error("Gagal kirim WA refund admin:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Status booking berhasil diperbarui.",
        data: updatedBooking,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal memperbarui status booking admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}
