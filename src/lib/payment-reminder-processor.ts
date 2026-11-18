import { prisma } from "@/lib/prisma";
import { notifyPaymentReminder } from "@/lib/notifications";

/**
 * Proses utama pengiriman pengingat pembayaran & pembersihan pesanan kedaluwarsa.
 * Digunakan oleh endpoint /api/cron/payment-reminder dan /api/cron/booking-lifecycle.
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
        `[PAYMENT REMINDER PROCESSOR] Gagal mengirim pengingat untuk booking ${booking.id}:`,
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
      property_id: true,
      room_type_id: true,
    },
  });

  let expiredBookingsCancelled = 0;
  for (const booking of overduePendingBookings) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update hanya jika status masih PENDING (mencegah race-condition dengan pembayaran yang baru masuk)
        const updated = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            cancellation_reason: "EXPIRED_UNPAID_TIMEOUT",
          },
        });

        // Jika status berhasil diubah ke CANCELLED, kembalikan kuota kamar ke inventaris
        if (updated.count > 0) {
          if (booking.property_id) {
            await tx.property.update({
              where: { id: booking.property_id },
              data: {
                available_rooms: {
                  increment: 1,
                },
              },
            });
          }

          if (booking.room_type_id) {
            await tx.roomType.update({
              where: { id: booking.room_type_id },
              data: {
                available_rooms: {
                  increment: 1,
                },
              },
            });
          }

          // Nonaktifkan magic link verifikasi yang belum terpakai
          await tx.magicLink.updateMany({
            where: {
              booking_id: booking.id,
              is_used: false,
            },
            data: {
              is_used: true,
            },
          });

          expiredBookingsCancelled++;
        }
      });
    } catch (err) {
      console.error(
        `[PAYMENT REMINDER PROCESSOR] Gagal membatalkan pesanan kedaluwarsa ${booking.id}:`,
        err
      );
    }
  }

  return { remindersSent, expiredBookingsCancelled };
}
