import { prisma } from "@/lib/prisma";
import {
  calculatePlatformCommission,
  createSnapTransaction,
  DEFAULT_TAKE_RATE,
  SERVICE_FEE,
} from "@/lib/midtrans";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { createInAppNotification } from "@/lib/notifications";
import { PAID_CONFIRMED_STATUSES } from "@/lib/booking-statuses";

export interface RecurringBillingSummary {
  invoicesCreated: number;
  remindersH7Sent: number;
  remindersH3Sent: number;
  overdueMarked: number;
  errors: string[];
}

export function calculateNextPeriodDueDate(
  baseDate: Date,
  monthOffset: number
): Date {
  const result = new Date(baseDate);
  result.setMonth(result.getMonth() + monthOffset);
  return result;
}

/**
 * Sub-Routine 1: Generate Monthly Invoices
 * Memeriksa seluruh booking aktif dan membuat Invoice tagihan sewa berkala untuk bulan berikutnya.
 */
export async function generateMonthlyInvoices(
  referenceDate: Date = new Date()
): Promise<{ createdCount: number; errors: string[] }> {
  let createdCount = 0;
  const errors: string[] = [];

  try {
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: PAID_CONFIRMED_STATUSES },
      },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        room_type: true,
        user: true,
        invoices: true,
      },
    });

    for (const booking of activeBookings) {
      try {
        if (!booking.property?.owner_id) continue;

        // Tentukan periode bulan berikutnya yang belum memiliki invoice
        const existingPeriods = booking.invoices.map((inv) => inv.month_period);
        const highestPeriod =
          existingPeriods.length > 0 ? Math.max(...existingPeriods) : 1;
        const nextPeriod = highestPeriod + 1;

        // Hitung tanggal jatuh tempo periode berikutnya
        // Periode 2 = move_in_date + 1 bulan, Periode 3 = move_in_date + 2 bulan, dst.
        const nextDueDate = calculateNextPeriodDueDate(
          new Date(booking.move_in_date),
          nextPeriod - 1
        );

        // Jendela penerbitan: terbitkan jika jatuh tempo berada dalam rentang <= 14 hari dari referenceDate
        const timeDiffMs = nextDueDate.getTime() - referenceDate.getTime();
        const daysUntilDue = timeDiffMs / (1000 * 60 * 60 * 24);

        if (daysUntilDue > 14) {
          // Belum waktunya menerbitkan invoice untuk periode ini
          continue;
        }

        // Cek idempotency: pastikan invoice untuk periode ini belum pernah dibuat
        const isAlreadyCreated = booking.invoices.some(
          (inv) => inv.month_period === nextPeriod
        );
        if (isAlreadyCreated) {
          continue;
        }

        // Hitung tarif sewa dan komisi platform (3%)
        const rentAmount =
          booking.room_type?.price_per_month ??
          booking.property.price_per_month ??
          booking.amount;
        const commission = calculatePlatformCommission(
          rentAmount,
          DEFAULT_TAKE_RATE
        );
        const serviceFee = SERVICE_FEE || 5000;
        const totalAmount = rentAmount + serviceFee;

        // Buat nomor invoice unik
        const datePrefix = new Date(referenceDate)
          .toISOString()
          .slice(0, 7)
          .replace("-", "");
        const bookingSnippet = booking.id.slice(0, 6).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `INV-${datePrefix}-${bookingSnippet}-P${nextPeriod}-${randomSuffix}`;

        // Inisiasi transaksi Midtrans Snap untuk direct payment URL
        let snapToken: string | null = null;
        let snapRedirectUrl: string | null = null;

        try {
          const snapRes = await createSnapTransaction({
            orderId: `INV__${invoiceNumber}`,
            grossAmount: totalAmount,
            customerDetails: {
              first_name: booking.student_name,
              email: booking.user?.email || undefined,
              phone: booking.student_whatsapp,
            },
            itemDetails: [
              {
                id: `RENT-${booking.property_id}`,
                name: `Sewa Kos ${booking.property.name} (Bulan ke-${nextPeriod})`.slice(
                  0,
                  50
                ),
                price: rentAmount,
                quantity: 1,
              },
              {
                id: "SERVICE_FEE",
                name: "Biaya Layanan KosPasti",
                price: serviceFee,
                quantity: 1,
              },
            ],
          });
          snapToken = snapRes.token;
          snapRedirectUrl = snapRes.redirect_url;
        } catch (snapErr) {
          console.warn(
            `[RECURRING BILLING] Gagal inisiasi Snap Midtrans untuk ${invoiceNumber}, menggunakan fallback URL internal:`,
            snapErr
          );
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          snapRedirectUrl = `${baseUrl}/pesanan`;
        }

        // Simpan entitas Invoice ke database
        await prisma.invoice.create({
          data: {
            invoice_number: invoiceNumber,
            booking_id: booking.id,
            owner_id: booking.property.owner_id,
            user_id: booking.user_id,
            month_period: nextPeriod,
            billing_date: referenceDate,
            due_date: nextDueDate,
            amount: rentAmount,
            platform_fee: commission.platformFee,
            service_fee: serviceFee,
            total_amount: totalAmount,
            net_owner_amount: commission.netAmount,
            status: "PENDING",
            snap_token: snapToken,
            snap_redirect_url: snapRedirectUrl,
          },
        });

        createdCount++;
      } catch (err: any) {
        const msg = `Gagal generate invoice untuk booking ${booking.id}: ${err?.message || err}`;
        console.error(`[RECURRING BILLING ERROR] ${msg}`);
        errors.push(msg);
      }
    }
  } catch (globalErr: any) {
    const msg = `Kesalahan query active bookings: ${globalErr?.message || globalErr}`;
    console.error(`[RECURRING BILLING GLOBAL ERROR] ${msg}`);
    errors.push(msg);
  }

  return { createdCount, errors };
}

/**
 * Sub-Routine 2: Send Due Billing Reminders (H-7 & H-3)
 * Mengirim notifikasi WhatsApp via Fonnte dan In-App Notification dengan direct Snap Pay URL.
 */
export async function sendDueBillingReminders(
  referenceDate: Date = new Date()
): Promise<{ remindersH7Sent: number; remindersH3Sent: number; errors: string[] }> {
  let remindersH7Sent = 0;
  let remindersH3Sent = 0;
  const errors: string[] = [];

  const refTime = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  try {
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        booking: {
          include: {
            property: true,
            user: true,
          },
        },
        owner: true,
      },
    });

    for (const invoice of pendingInvoices) {
      try {
        const dueTime = new Date(invoice.due_date).getTime();
        const diffDays = (dueTime - refTime) / dayMs;

        const tenantWhatsapp = invoice.booking?.student_whatsapp;
        const tenantName = invoice.booking?.student_name || "Penyewa";
        const propertyName = invoice.booking?.property?.name || "Kos";
        const totalRupiah = `Rp ${invoice.total_amount.toLocaleString("id-ID")}`;
        const dueDateFormatted = new Date(invoice.due_date).toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );
        const payUrl =
          invoice.snap_redirect_url ||
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pesanan`;

        // 1. Cek Pengingat H-7 (antara 6 s.d. 8 hari sebelum jatuh tempo)
        if (
          diffDays >= 6 &&
          diffDays <= 8 &&
          !invoice.reminder_h7_sent_at
        ) {
          const messageH7 = [
            `[KosPasti] Halo ${tenantName}! 🔔`,
            `Tagihan sewa kos bulan ke-${invoice.month_period} untuk ${propertyName} sebesar ${totalRupiah} telah terbit.`,
            `Jatuh tempo: ${dueDateFormatted}.`,
            `Lakukan pembayaran instan tanpa antre via tautan resmi berikut:`,
            `${payUrl}`,
            `Pembayaran otomatis terverifikasi dan hak tinggal Anda diperpanjang dengan aman.`,
          ].join("\n");

          if (tenantWhatsapp) {
            await sendWhatsAppMessage({
              to: tenantWhatsapp,
              message: messageH7,
            });
          }

          if (invoice.user_id) {
            await createInAppNotification({
              userId: invoice.user_id,
              title: `Tagihan Sewa Bulan ke-${invoice.month_period} Terbit`,
              message: `Tagihan sewa untuk ${propertyName} sebesar ${totalRupiah} jatuh tempo pada ${dueDateFormatted}.`,
              type: "BOOKING_STATUS",
              link: payUrl,
            });
          }

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { reminder_h7_sent_at: referenceDate },
          });

          remindersH7Sent++;
        }

        // 2. Cek Pengingat H-3 (antara 2 s.d. 4 hari sebelum jatuh tempo)
        if (
          diffDays >= 2 &&
          diffDays <= 4 &&
          !invoice.reminder_h3_sent_at
        ) {
          const messageH3 = [
            `[KosPasti] Pengingat Jatuh Tempo Sewa Kos ⏰`,
            `Halo ${tenantName}, tagihan sewa kos bulan ke-${invoice.month_period} di ${propertyName} sebesar ${totalRupiah} akan jatuh tempo dalam 3 hari (${dueDateFormatted}).`,
            `Klik tautan di bawah untuk menyelesaikan pembayaran langsung:`,
            `${payUrl}`,
            `Abaikan pesan ini jika Anda telah menyelesaikan pembayaran.`,
          ].join("\n");

          if (tenantWhatsapp) {
            await sendWhatsAppMessage({
              to: tenantWhatsapp,
              message: messageH3,
            });
          }

          if (invoice.user_id) {
            await createInAppNotification({
              userId: invoice.user_id,
              title: `Peringatan Jatuh Tempo Sewa Kos (H-3)`,
              message: `Tagihan sewa untuk ${propertyName} jatuh tempo pada ${dueDateFormatted}. Segera selesaikan pembayaran.`,
              type: "BOOKING_STATUS",
              link: payUrl,
            });
          }

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { reminder_h3_sent_at: referenceDate },
          });

          remindersH3Sent++;
        }
      } catch (itemErr: any) {
        const msg = `Gagal mengirim pengingat invoice ${invoice.id}: ${itemErr?.message || itemErr}`;
        console.error(`[REMINDER ERROR] ${msg}`);
        errors.push(msg);
      }
    }
  } catch (globalErr: any) {
    const msg = `Kesalahan query pending invoices: ${globalErr?.message || globalErr}`;
    console.error(`[REMINDER GLOBAL ERROR] ${msg}`);
    errors.push(msg);
  }

  return { remindersH7Sent, remindersH3Sent, errors };
}

/**
 * Sub-Routine 3: Mark Overdue Invoices
 * Menandai invoice PENDING yang melewati tanggal jatuh tempo menjadi OVERDUE.
 */
export async function markOverdueInvoices(
  referenceDate: Date = new Date()
): Promise<{ overdueMarked: number; errors: string[] }> {
  const errors: string[] = [];
  let overdueMarked = 0;

  try {
    const result = await prisma.invoice.updateMany({
      where: {
        status: "PENDING",
        due_date: {
          lt: referenceDate,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    overdueMarked = result.count;
  } catch (err: any) {
    const msg = `Gagal update status overdue invoice: ${err?.message || err}`;
    console.error(`[OVERDUE ERROR] ${msg}`);
    errors.push(msg);
  }

  return { overdueMarked, errors };
}

/**
 * Master Routine: Menjalankan keseluruhan pipeline penagihan berkala
 */
export async function runRecurringBillingProcess(
  referenceDate: Date = new Date()
): Promise<RecurringBillingSummary> {
  const { createdCount, errors: creationErrors } =
    await generateMonthlyInvoices(referenceDate);

  const {
    remindersH7Sent,
    remindersH3Sent,
    errors: reminderErrors,
  } = await sendDueBillingReminders(referenceDate);

  const { overdueMarked, errors: overdueErrors } =
    await markOverdueInvoices(referenceDate);

  return {
    invoicesCreated: createdCount,
    remindersH7Sent,
    remindersH3Sent,
    overdueMarked,
    errors: [...creationErrors, ...reminderErrors, ...overdueErrors],
  };
}
