import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID booking diperlukan",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        room_type: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (booking.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Pembayaran sudah dilakukan sebelumnya",
        },
        { status: 400 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Status booking tidak valid untuk pembayaran (status saat ini: ${booking.status})`,
        },
        { status: 400 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id.trim() },
      data: {
        status: "PAID",
      },
    });

    const owner = booking.property?.owner;
    const ownerPhone = owner?.whatsapp_number;
    const ownerName = owner?.name || "Pemilik Kos";
    const studentName = booking.student_name;
    const propertyName = booking.property?.name || "Kos";
    const moveInDateFormatted = new Date(booking.move_in_date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let verificationUrl = "";

    // Generate Magic Link for owner verification if owner exists
    if (owner) {
      // Invalidate existing active verification magic links for this booking
      await prisma.magicLink.updateMany({
        where: {
          booking_id: booking.id,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.magicLink.create({
        data: {
          token,
          type: "BOOKING_VERIFICATION",
          expires_at: expiresAt,
          owner_id: owner.id,
          booking_id: booking.id,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      verificationUrl = `${baseUrl}/booking/verify/${token}`;

      // Send WhatsApp message to Owner
      if (ownerPhone) {
        const ownerMessage = [
          `Halo Bapak/Ibu *${ownerName}*,`,
          ``,
          `Ada pesanan kamar baru di *${propertyName}*!`,
          `👤 *Nama Pemesan:* ${studentName}`,
          `📱 *No. WhatsApp:* ${booking.student_whatsapp}`,
          `📅 *Rencana Masuk:* ${moveInDateFormatted}`,
          `🏷️ *Tipe Kamar:* ${booking.room_type?.name || "Standar"}`,
          `💰 *Status:* DP Pembayaran Berhasil (PAID)`,
          ``,
          `Silakan klik tautan verifikasi berikut untuk memeriksa profil pemesan dan *Terima/Tolak* pesanan:`,
          `👉 ${verificationUrl}`,
          ``,
          `_Catatan: Tautan ini aman tanpa perlu login dan berlaku selama 24 jam._`,
        ].join("\n");

        await sendWhatsAppMessage({
          to: ownerPhone,
          message: ownerMessage,
        });
      }
    }

    // Send WhatsApp notification receipt to Student
    if (booking.student_whatsapp) {
      const studentMessage = [
        `Halo *${studentName}*,`,
        ``,
        `Pembayaran DP pemesanan kamar di *${propertyName}* telah berhasil!`,
        `📅 *Tanggal Masuk:* ${moveInDateFormatted}`,
        `🏷️ *Tipe Kamar:* ${booking.room_type?.name || "Standar"}`,
        ``,
        `Pesanan Anda saat ini sedang menunggu konfirmasi akhir dari pemilik kos. Kami akan segera mengabari Anda melalui WhatsApp setelah pesanan dikonfirmasi.`,
        ``,
        `Terima kasih telah menggunakan *KosPasti*!`,
      ].join("\n");

      await sendWhatsAppMessage({
        to: booking.student_whatsapp,
        message: studentMessage,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pembayaran berhasil dikonfirmasi dan notifikasi WhatsApp telah dikirim.",
        data: updatedBooking,
        verificationUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengonfirmasi pembayaran booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengonfirmasi pembayaran",
      },
      { status: 500 }
    );
  }
}
