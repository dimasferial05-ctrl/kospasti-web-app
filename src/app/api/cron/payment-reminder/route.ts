import { NextResponse } from "next/server";
import { runPaymentReminderProcess } from "@/lib/payment-reminder-processor";

/**
 * Rutin Cron Otomasi Pengingat Pembayaran via WhatsApp & Pembersihan Pesanan Kedaluwarsa.
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
