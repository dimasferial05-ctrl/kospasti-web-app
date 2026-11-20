import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyMidtransSignature,
  evaluateMidtransStatus,
} from "@/lib/midtrans";
import { fulfillPaidBooking } from "@/lib/payment-fulfillment";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { error: "Payload not provided or invalid JSON" },
        { status: 400 }
      );
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { error: "Missing required signature validation fields" },
        { status: 400 }
      );
    }

    // 1. Verifikasi tanda tangan digital (SHA-512)
    const isValidSignature = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValidSignature) {
      console.warn(
        `[MIDTRANS WEBHOOK WARNING] Tanda tangan tidak valid untuk order_id: ${order_id}`
      );
      return NextResponse.json(
        { error: "Invalid signature key" },
        { status: 401 }
      );
    }

    // 2. Cek apakah ini transaksi tagihan sewa berkala (Invoice)
    const rawOrderId = String(order_id);
    if (rawOrderId.startsWith("INV__") || rawOrderId.startsWith("INV-")) {
      const invoiceKey = rawOrderId.includes("__")
        ? rawOrderId.split("__")[1]
        : rawOrderId;
      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [
            { id: invoiceKey },
            { invoice_number: invoiceKey },
            { invoice_number: rawOrderId },
          ],
        },
        include: {
          booking: {
            include: { property: true, user: true },
          },
          owner: true,
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { status: "OK", message: "Invoice not found or acknowledged" },
          { status: 200 }
        );
      }

      if (invoice.status === "PAID") {
        return NextResponse.json(
          {
            status: "OK",
            message: "Invoice already marked as PAID (Idempotent OK)",
          },
          { status: 200 }
        );
      }

      const evaluatedStatus = evaluateMidtransStatus(
        transaction_status,
        fraud_status
      );

      if (evaluatedStatus === "PAID") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paid_at: new Date(),
            payment_method: payment_type || "MIDTRANS",
            payment_gateway_ref: transaction_id || null,
          },
        });

        if (invoice.booking?.student_whatsapp) {
          try {
            await sendWhatsAppMessage({
              to: invoice.booking.student_whatsapp,
              message: `[KosPasti] Pembayaran sewa kos bulan ke-${invoice.month_period} untuk ${invoice.booking.property?.name || "Kos"} sebesar Rp ${invoice.total_amount.toLocaleString("id-ID")} telah berhasil diverifikasi. Terima kasih!`,
            });
          } catch (waErr) {
            console.warn("[MIDTRANS WEBHOOK INVOICE WA ERROR]:", waErr);
          }
        }

        return NextResponse.json(
          { status: "OK", message: "Invoice payment processed successfully" },
          { status: 200 }
        );
      } else if (evaluatedStatus === "CANCELLED") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json(
          { status: "OK", message: "Invoice marked as CANCELLED" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          status: "OK",
          message: `Invoice status updated to ${evaluatedStatus}`,
        },
        { status: 200 }
      );
    }

    // 3. Ambil data booking dari database beserta relasi terkait
    const cleanBookingId = rawOrderId.includes("__")
      ? rawOrderId.split("__")[0]
      : rawOrderId;

    const booking = await prisma.booking.findUnique({
      where: { id: cleanBookingId },
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
      console.log(
        `[MIDTRANS WEBHOOK] Pesanan dengan ID ${cleanBookingId} (raw: ${order_id}) tidak ditemukan di database. Mengembalikan 200 OK untuk pengujian URL notifikasi Midtrans.`
      );
      return NextResponse.json(
        {
          status: "OK",
          message: "Notification acknowledged (test ping or order not found)",
        },
        { status: 200 }
      );
    }

    // 3. Idempotency Check: Jika status pesanan sudah lunas (PAID/COMPLETED) atau sudah CANCELLED, hentikan pemrosesan
    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return NextResponse.json(
        {
          status: "OK",
          message: "Transaction already fulfilled and marked as PAID (Idempotent OK)",
        },
        { status: 200 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          status: "OK",
          message: "Transaction already marked as CANCELLED (Idempotent OK)",
        },
        { status: 200 }
      );
    }

    // 4. Evaluasi status transaksi dari Midtrans
    const evaluatedStatus = evaluateMidtransStatus(transaction_status, fraud_status);

    if (evaluatedStatus === "PAID") {
      // Pembayaran sukses: penuhi pesanan
      const result = await fulfillPaidBooking({
        bookingId: booking.id,
        paymentMethod: payment_type || "MIDTRANS",
        paymentGatewayRef: transaction_id || null,
        paidAt: new Date(),
        existingBooking: booking,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.message || "Failed to fulfill paid booking" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { status: "OK", message: "Payment processed successfully" },
        { status: 200 }
      );
    } else if (evaluatedStatus === "CANCELLED") {
      // Pembayaran dibatalkan atau kedaluwarsa oleh Midtrans:
      // Jalankan dalam Database Transaction atomik untuk memastikan status pesanan diperbarui
      // dan kuota kamar (Property & RoomType) dipulihkan ke inventaris.
      await prisma.$transaction(async (tx) => {
        // Pembaruan bersyarat: hanya update jika status saat ini masih PENDING
        // Mencegah double-increment jika notifikasi webhook diterima berulang kali
        const updated = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            cancellation_reason: `Midtrans payment ${transaction_status}`,
          },
        });

        // Kembalikan kuota kamar HANYA jika status berhasil diubah dari PENDING ke CANCELLED
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
        }
      });

      return NextResponse.json(
        { status: "OK", message: "Booking marked as CANCELLED and room inventory restored" },
        { status: 200 }
      );
    }

    // Status pending / transaksi sedang berjalan
    return NextResponse.json(
      { status: "OK", message: `Notification recorded: status ${transaction_status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MIDTRANS WEBHOOK ERROR] Terjadi kegagalan pemrosesan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
