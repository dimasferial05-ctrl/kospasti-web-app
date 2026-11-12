import { prisma } from "@/lib/prisma";
import { notifyEscrowReleased } from "@/lib/notifications";

/**
 * Lazy evaluation processor untuk grace period payout (12 jam setelah check-in dikonfirmasi).
 * Dijalankan secara otomatis saat panel admin payout diakses atau via cron job booking lifecycle.
 */
export async function processReadyPayouts(): Promise<number> {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  // Cari booking COMPLETED yang grace period-nya (12 jam) sudah habis dan belum memiliki record Payout
  const readyBookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      checkin_confirmed_at: { lte: twelveHoursAgo },
      payout: null,
    },
    include: {
      property: {
        include: { owner: true },
      },
      room_type: true,
    },
  });

  // Buat Payout record untuk setiap booking yang siap
  let processedCount = 0;
  for (const booking of readyBookings) {
    try {
      const payoutAmount =
        booking.amount > 0
          ? booking.amount
          : booking.room_type?.price_per_month || booking.property?.price_per_month || 0;

      await prisma.$transaction([
        prisma.payout.create({
          data: {
            booking_id: booking.id,
            owner_id: booking.property.owner_id,
            amount: payoutAmount,
            status: "PAYOUT_PENDING",
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "PAYOUT_PENDING",
            ...(booking.amount === 0 && payoutAmount > 0 ? { amount: payoutAmount } : {}),
          },
        }),
      ]);
      processedCount++;

      // Beritahu mitra bahwa dana escrow telah dilepaskan dan siap dicairkan
      try {
        if (booking.property?.owner) {
          await notifyEscrowReleased({
            ownerName: booking.property.owner.name,
            ownerWhatsapp: booking.property.owner.whatsapp_number,
            tenantName: booking.student_name,
            propertyName: booking.property.name,
            amount: payoutAmount,
            ownerId: booking.property.owner.id,
          });
        }
      } catch (notifyErr) {
        console.error(`[PAYOUT PROCESSOR] Gagal kirim notifikasi escrow ke owner ${booking.property?.owner_id}:`, notifyErr);
      }
    } catch (itemErr) {
      console.error(`[PAYOUT PROCESSOR] Gagal memproses booking ${booking.id}:`, itemErr);
    }
  }

  return processedCount;
}

