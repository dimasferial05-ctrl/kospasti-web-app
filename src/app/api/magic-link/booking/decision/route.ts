import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.token || typeof body.token !== "string" || !body.token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter token diperlukan",
        },
        { status: 400 }
      );
    }

    const token = body.token.trim();
    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (action !== "ACCEPT" && action !== "REJECT") {
      return NextResponse.json(
        {
          success: false,
          error: "Aksi tidak valid. Nilai harus 'ACCEPT' atau 'REJECT'.",
        },
        { status: 400 }
      );
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: {
        owner: true,
        booking: {
          include: {
            property: true,
            room_type: true,
          },
        },
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi ini sudah pernah digunakan sebelumnya.",
        },
        { status: 410 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi sudah kedaluwarsa.",
        },
        { status: 410 }
      );
    }

    if (!magicLink.booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Data pesanan tidak terhubung dengan tautan ini.",
        },
        { status: 400 }
      );
    }

    const booking = magicLink.booking;
    const property = booking.property;
    const roomType = booking.room_type;
    const ownerName = magicLink.owner.name;
    const studentName = booking.student_name;
    const propertyName = property.name;
    const moveInDateFormatted = new Date(booking.move_in_date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Execute decision in atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark magic link as used
      await tx.magicLink.update({
        where: { id: magicLink.id },
        data: { is_used: true },
      });

      if (action === "ACCEPT") {
        // Update booking to ACCEPTED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "ACCEPTED" },
        });
      } else {
        // Update booking to REJECTED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "REJECTED" },
        });

        // Restore room availability (+1)
        await tx.property.update({
          where: { id: property.id },
          data: {
            available_rooms: { increment: 1 },
          },
        });

        if (roomType) {
          await tx.roomType.update({
            where: { id: roomType.id },
            data: {
              available_rooms: { increment: 1 },
            },
          });
        }
      }
    });

    // Send WhatsApp notification to student regarding owner's decision
    if (booking.student_whatsapp) {
      if (action === "ACCEPT") {
        const acceptMessage = [
          `Halo *${studentName}*, kabar gembira! 🎉`,
          ``,
          `Pesanan kamar Anda di *${propertyName}* telah *DIKONFIRMASI & DITERIMA* oleh pemilik kos (*${ownerName}*).`,
          ``,
          `📋 *Detail Pesanan:*`,
          `🏠 *Kos:* ${propertyName}`,
          `🏷️ *Tipe:* ${roomType?.name || "Standar"}`,
          `📅 *Tanggal Masuk:* ${moveInDateFormatted}`,
          `📍 *Alamat:* ${property.address || "Lihat detail di aplikasi KosPasti"}`,
          ``,
          `Selamat menempati hunian baru Anda! Jika ada pertanyaan, Anda dapat langsung berkoordinasi dengan pemilik kos.`,
          ``,
          `_Salam hangat dari KosPasti._`,
        ].join("\n");

        await sendWhatsAppMessage({
          to: booking.student_whatsapp,
          message: acceptMessage,
        });
      } else {
        const rejectMessage = [
          `Halo *${studentName}*,`,
          ``,
          `Mohon maaf, pesanan kamar Anda di *${propertyName}* saat ini *BELUM DAPAT DISETUJUI* oleh pemilik kos (*${ownerName}*).`,
          reason ? `📝 *Alasan:* ${reason}` : ``,
          ``,
          `Jangan khawatir, dana pembayaran DP yang telah Anda bayarkan akan segera diproses pengembaliannya (*refund*).`,
          ``,
          `Silakan temukan pilihan kamar kos nyaman lainnya di *KosPasti*!`,
        ]
          .filter(Boolean)
          .join("\n");

        await sendWhatsAppMessage({
          to: booking.student_whatsapp,
          message: rejectMessage,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          action === "ACCEPT"
            ? "Pesanan berhasil diterima dan dikonfirmasi."
            : "Pesanan telah ditolak dan ketersediaan kamar telah dikembalikan.",
        action,
        status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing booking decision:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memproses keputusan",
      },
      { status: 500 }
    );
  }
}
