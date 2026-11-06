import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  notifyCheckinConfirmed,
  notifyMoveInReminder,
  notifyReviewPrompt,
} from "@/lib/notifications";
import { sendMoveInReminderEmail, sendReviewPromptEmail } from "@/lib/email";
import { processReadyPayouts } from "@/lib/payout-processor";

async function executeBookingLifecycleRoutine(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Proteksi keamanan: wajib memiliki token CRON_SECRET yang cocok
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing CRON secret token",
        },
        { status: 401 }
      );
    }

    const now = new Date();

    // =========================================================================
    // SUB-ROUTINE 1: Pengingat H-1 Masuk Kos (Automated Reminder)
    // Jendela waktu: move_in_date antara sekarang s.d. 36 jam ke depan
    // =========================================================================
    const reminderWindowStart = now;
    const reminderWindowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const reminderBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["APPROVED", "ACCEPTED", "PAID"] },
        reminder_sent_at: null,
        move_in_date: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
      },
      include: {
        property: {
          include: { owner: true },
        },
        room_type: true,
        user: true,
      },
    });

    let remindersSent = 0;
    for (const booking of reminderBookings) {
      try {
        // Kirim WhatsApp ke mahasiswa
        await notifyMoveInReminder({
          tenantName: booking.student_name,
          tenantWhatsapp: booking.student_whatsapp,
          propertyName: booking.property.name,
          propertyAddress: booking.property.address,
          moveInDate: booking.move_in_date,
          ownerName: booking.property.owner?.name,
          ownerWhatsapp: booking.property.owner?.whatsapp_number,
          bookingId: booking.id,
        });

        // Kirim Email jika mahasiswa memiliki alamat email terdaftar
        if (booking.user?.email) {
          await sendMoveInReminderEmail({
            studentEmail: booking.user.email,
            studentName: booking.student_name,
            propertyName: booking.property.name,
            propertyAddress: booking.property.address || undefined,
            roomTypeName: booking.room_type?.name || undefined,
            moveInDate: booking.move_in_date,
            ownerName: booking.property.owner?.name || undefined,
            ownerWhatsapp: booking.property.owner?.whatsapp_number || undefined,
            bookingId: booking.id,
          });
        }

        // Tandai reminder telah terkirim (idempotensi)
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder_sent_at: now },
        });

        remindersSent++;
      } catch (err) {
        console.error(`[CRON LIFECYCLE] Gagal kirim reminder booking ${booking.id}:`, err);
      }
    }

    // =========================================================================
    // SUB-ROUTINE 2: Auto Check-in & Pelepasan Dana Escrow
    // 2.A: Auto check-in pesanan yang lewat >12 jam dari tanggal masuk tanpa konfirmasi mitra
    // 2.B: Pelepasan dana escrow untuk booking COMPLETED >12 jam pasca check-in
    // =========================================================================
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const overdueCheckinBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["APPROVED", "ACCEPTED", "PAID"] },
        move_in_date: { lte: twelveHoursAgo },
        checkin_confirmed_at: null,
      },
      include: {
        property: true,
      },
    });

    let autoCheckins = 0;
    for (const booking of overdueCheckinBookings) {
      try {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            checkin_confirmed_at: now,
          },
        });
        autoCheckins++;

        // Beritahu mahasiswa bahwa check-in telah tercatat dan masa garansi 12 jam dimulai
        await notifyCheckinConfirmed({
          tenantName: booking.student_name,
          tenantWhatsapp: booking.student_whatsapp,
          propertyName: booking.property.name,
          checkinTime: now,
        });
      } catch (err) {
        console.error(`[CRON LIFECYCLE] Gagal auto check-in booking ${booking.id}:`, err);
      }
    }

    // Pelepasan dana escrow untuk booking yang sudah check-in >= 12 jam yang lalu
    const escrowReleased = await processReadyPayouts();

    // =========================================================================
    // SUB-ROUTINE 3: Pemicu Ulasan Otomatis (Review Prompt Hari ke-2)
    // Jendela: Booking COMPLETED / PAYOUT_PENDING / PAYOUT_PAID >= 48 jam pasca check-in
    // =========================================================================
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const reviewPromptBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["COMPLETED", "PAYOUT_PENDING", "PAYOUT_PAID"] },
        checkin_confirmed_at: { lte: fortyEightHoursAgo },
        review: null,
        review_prompted_at: null,
      },
      include: {
        property: true,
        user: true,
      },
    });

    let reviewPromptsSent = 0;
    for (const booking of reviewPromptBookings) {
      try {
        // Kirim WhatsApp ajakan ulasan
        await notifyReviewPrompt({
          tenantName: booking.student_name,
          tenantWhatsapp: booking.student_whatsapp,
          propertyName: booking.property.name,
          propertyId: booking.property_id,
          bookingId: booking.id,
        });

        // Kirim Email ajakan ulasan jika ada email mahasiswa
        if (booking.user?.email) {
          await sendReviewPromptEmail({
            studentEmail: booking.user.email,
            studentName: booking.student_name,
            propertyName: booking.property.name,
            propertyId: booking.property_id,
            bookingId: booking.id,
          });
        }

        // Tandai review prompt telah dikirim (idempotensi)
        await prisma.booking.update({
          where: { id: booking.id },
          data: { review_prompted_at: now },
        });

        reviewPromptsSent++;
      } catch (err) {
        console.error(`[CRON LIFECYCLE] Gagal kirim prompt ulasan booking ${booking.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        remindersSent,
        autoCheckins,
        escrowReleased,
        reviewPromptsSent,
      },
    });
  } catch (error) {
    console.error("[CRON LIFECYCLE ERROR] Gagal mengeksekusi booking lifecycle routine:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menjalankan booking lifecycle cron",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return executeBookingLifecycleRoutine(request);
}

export async function POST(request: Request) {
  return executeBookingLifecycleRoutine(request);
}
