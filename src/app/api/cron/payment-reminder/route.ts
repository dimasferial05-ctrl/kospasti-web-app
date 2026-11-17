import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPaymentReminder } from "@/lib/notifications";

/**
 * Proses utama pengiriman pengingat pembayaran & pembersihan pesanan kedaluwarsa.
 * Dapat dipanggil langsung dari endpoint /api/cron/payment-reminder maupun
 * diintegrasikan sebagai sub-routine pada /api/cron/booking-lifecycle.
 */
export async function runPaymentReminderProcess(now = new Date()): Promise<{
  remindersSent: number;
  expiredBookingsCancelled: number;
}> {
  // Jendela waktu pengingat:
  // - Dibuat minimal 2 jam yang lalu (agar tidak spam calon penyewa yang baru saja checkout)
  // - Dibuat maksimal 24 jam yang lalu (sebelum batas waktu pembayaran kedaluwarsa)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // =========================================================================
  // SUB-ROUTINE 1: Kirim Pengingat Pembayaran ke Mahasiswa (Reminder Window)
  // =========================================================================
  const pendingBookingsForReminder = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      payment_reminder_sent_at: null,
      created_at: {
        gte: twentyFourHoursAgo,
        lte: twoHoursAgo,
      },
    },
    include: {
      property: true,
      room_type: true,
      user: true,
    },
  });

  let remindersSent = 0;
  for (const booking of pendingBookingsForReminder) {
    try {
      const rentPrice =
        booking.amount > 0
          ? booking.amount
          : booking.room_type?.price_per_month || booking.property?.price_per_month || 0;

      const serviceFee = booking.service_fee || 5000;
      const totalAmount = rentPrice + serviceFee;

      // Kirim WhatsApp dan notifikasi In-App
      await notifyPaymentReminder({
        tenantName: booking.student_name,
        tenantWhatsapp: booking.student_whatsapp,
        propertyName: booking.property?.name || "Kamar Kos",
        roomTypeName: booking.room_type?.name,
        amount: totalAmount,
        bookingId: booking.id,
        createdAt: booking.created_at,
        userId: booking.user_id,
      });

      // Tandai bahwa pengingat telah dikirimkan (menjamin idempotensi)
      await prisma.booking.update({
        where: { id: booking.id },
        data: { payment_reminder_sent_at: now },
      });

      remindersSent++;
    } catch (err) {
      console.error(
        `[CRON PAYMENT REMINDER] Gagal mengirim pengingat untuk booking ${booking.id}:`,
        err
      );
    }
  }

  // =========================================================================
  // SUB-ROUTINE 2: Otomatis Batalkan Pesanan PENDING yang Lewat 24 Jam
  // =========================================================================
  const overduePendingBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      created_at: {
        lt: twentyFourHoursAgo,
      },
    },
    select: {
      id: true,
    },
  });

  let expiredBookingsCancelled = 0;
  for (const booking of overduePendingBookings) {
    try {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancellation_reason: "EXPIRED_UNPAID_TIMEOUT",
        },
      });
      expiredBookingsCancelled++;
    } catch (err) {
      console.error(
        `[CRON PAYMENT REMINDER] Gagal membatalkan pesanan kedaluwarsa ${booking.id}:`,
        err
      );
    }
  }

  return { remindersSent, expiredBookingsCancelled };
}

/**
 * Rutin Cron Otomasi Pengingat Pembayaran via WhatsApp & Pembersihan Pesanan Kedaluwarsa
 * Endpoint ini dapat dipanggil via trigger eksternal / cron service mandiri.
 */
async function executePaymentReminderRoutine(request: Request) {
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
    const summary = await runPaymentReminderProcess(now);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary,
    });
  } catch (error) {
    console.error(
      "[CRON PAYMENT REMINDER ERROR] Gagal mengeksekusi payment reminder cron:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menjalankan payment reminder cron",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return executePaymentReminderRoutine(request);
}

export async function POST(request: Request) {
  return executePaymentReminderRoutine(request);
}
