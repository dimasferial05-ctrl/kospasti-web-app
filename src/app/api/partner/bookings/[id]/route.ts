import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    let status = body?.status?.toUpperCase?.();

    if (status === "ACCEPTED") {
      status = "APPROVED";
    }

    if (!status || !["APPROVED", "REJECTED", "PENDING", "REFUNDED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status harus bernilai APPROVED, REJECTED, PENDING, atau REFUNDED." },
        { status: 400 }
      );
    }

    // Pastikan booking milik properti dari owner ini
    const existing = await prisma.booking.findFirst({
      where: {
        id,
        property: {
          owner_id: payload.ownerId,
        },
      },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        room_type: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan atau bukan milik properti Anda." },
        { status: 404 }
      );
    }

    const previousStatus = existing.status;

    const updated = await prisma.$transaction(async (tx) => {
      // Invalidate magic links
      await tx.magicLink.updateMany({
        where: {
          booking_id: existing.id,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      const updateData: {
        status: string;
        refunded_at?: Date;
        refund_note?: string;
      } = { status };

      if (status === "REFUNDED") {
        updateData.refunded_at = new Date();
        if (body?.refund_note && typeof body.refund_note === "string") {
          updateData.refund_note = body.refund_note.trim();
        }
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
      });

      // Kembalikan kamar jika REJECTED (dan belum pernah dikembalikan)
      if (status === "REJECTED" && previousStatus !== "REJECTED" && previousStatus !== "CANCELLED" && previousStatus !== "REFUND_REQUESTED") {
        await tx.property.update({
          where: { id: existing.property_id },
          data: { available_rooms: { increment: 1 } },
        });

        if (existing.room_type_id) {
          await tx.roomType.update({
            where: { id: existing.room_type_id },
            data: { available_rooms: { increment: 1 } },
          });
        }
      }

      // Catatan: Jika status === "REFUNDED" dan previousStatus === "REFUND_REQUESTED", kuota kamar SUDAH dikembalikan
      // saat user mengajukan cancel, jadi tidak di-increment lagi untuk mencegah double-count.
      // Namun jika status berubah ke REFUNDED langsung dari PAID/APPROVED tanpa melalui REFUND_REQUESTED:
      if (status === "REFUNDED" && previousStatus !== "REFUND_REQUESTED" && previousStatus !== "REJECTED" && previousStatus !== "CANCELLED") {
        await tx.property.update({
          where: { id: existing.property_id },
          data: { available_rooms: { increment: 1 } },
        });

        if (existing.room_type_id) {
          await tx.roomType.update({
            where: { id: existing.room_type_id },
            data: { available_rooms: { increment: 1 } },
          });
        }
      }

      return updatedBooking;
    });

    // Send WhatsApp notification if status changed to APPROVED, REJECTED, or REFUNDED
    if (existing.student_whatsapp && previousStatus !== status) {
      const ownerName = existing.property.owner?.name || "Pemilik Kos";
      const propertyName = existing.property.name;
      const moveInDateFormatted = new Date(existing.move_in_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (status === "APPROVED") {
        const acceptMessage = [
          `Halo *${existing.student_name}*, kabar gembira! 🎉`,
          ``,
          `Pesanan kamar Anda di *${propertyName}* telah *DISETUJUI* oleh pemilik kos (*${ownerName}*) melalui Dasbor Mitra.`,
          ``,
          `📋 *Detail Pesanan:*`,
          `🏠 *Kos:* ${propertyName}`,
          `🏷️ *Tipe:* ${existing.room_type?.name || "Standar"}`,
          `📅 *Tanggal Masuk:* ${moveInDateFormatted}`,
          `📍 *Alamat:* ${existing.property.address || "Lihat detail di aplikasi KosPasti"}`,
          ``,
          `Selamat menempati hunian baru Anda! Hubungi pemilik kos untuk koordinasi penyerahan kunci.`,
          ``,
          `_Salam hangat dari KosPasti._`,
        ].join("\n");

        await sendWhatsAppMessage({
          to: existing.student_whatsapp,
          message: acceptMessage,
        }).catch((err) => console.error("Gagal kirim WA persetujuan:", err));
      } else if (status === "REJECTED") {
        const rejectMessage = [
          `Halo *${existing.student_name}*,`,
          ``,
          `Mohon maaf, pesanan kamar Anda di *${propertyName}* saat ini *DITOLAK / TIDAK DAPAT DISETUJUI* oleh pemilik kos (*${ownerName}*).`,
          ``,
          `Jangan khawatir, dana pembayaran DP yang telah Anda bayarkan akan segera diproses pengembaliannya (*refund*).`,
          ``,
          `Silakan temukan pilihan kamar kos nyaman lainnya di *KosPasti*!`,
        ].join("\n");

        await sendWhatsAppMessage({
          to: existing.student_whatsapp,
          message: rejectMessage,
        }).catch((err) => console.error("Gagal kirim WA penolakan:", err));
      } else if (status === "REFUNDED") {
        const refundNoteText = body?.refund_note ? `\n\nCatatan / Referensi: *${body.refund_note}*` : "";
        const refundMessage = [
          `Halo *${existing.student_name}*,`,
          ``,
          `Pengembalian dana (*refund*) untuk pesanan kamar Anda di *${propertyName}* telah selesai diproses oleh pemilik kos (*${ownerName}*).${refundNoteText}`,
          ``,
          `Silakan periksa saldo rekening atau e-wallet yang telah Anda daftarkan.`,
          ``,
          `Terima kasih telah menggunakan *KosPasti*.`,
        ].join("\n");

        await sendWhatsAppMessage({
          to: existing.student_whatsapp,
          message: refundMessage,
        }).catch((err) => console.error("Gagal kirim WA refund:", err));
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Status pesanan berhasil diubah menjadi ${status}.`,
        booking: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengubah status booking mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
