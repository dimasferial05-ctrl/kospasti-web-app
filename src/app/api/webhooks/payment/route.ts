import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyMidtransSignature,
  evaluateMidtransStatus,
} from "@/lib/midtrans";
import { fulfillPaidBooking } from "@/lib/payment-fulfillment";

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

    // 2. Ambil data booking dari database beserta relasi terkait
    const rawOrderId = String(order_id);
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

    // 3. Idempotency Check: Jika status pesanan sudah lunas (PAID/COMPLETED), hentikan pemrosesan
    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return NextResponse.json(
        {
          status: "OK",
          message: "Transaction already fulfilled and marked as PAID (Idempotent OK)",
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
      // Pembayaran dibatalkan atau kedaluwarsa
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancellation_reason: `Midtrans payment ${transaction_status}`,
        },
      });

      return NextResponse.json(
        { status: "OK", message: "Booking marked as CANCELLED" },
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
