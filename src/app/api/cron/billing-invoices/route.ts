import { NextResponse } from "next/server";
import { runRecurringBillingProcess } from "@/lib/recurring-billing-processor";

/**
 * Vercel Cron Routine: Penagihan Sewa Bulanan Otomatis (Recurring Tenant Billing).
 * Mengenerate invoice berkala, mengirimkan notifikasi H-7 & H-3 via WA dengan Snap URL,
 * dan menandai tagihan overdue.
 */
async function executeBillingInvoicesRoutine(request: Request) {
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
    const summary = await runRecurringBillingProcess(now);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary,
    });
  } catch (error) {
    console.error(
      "[CRON BILLING INVOICES ERROR] Gagal mengeksekusi recurring billing cron:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Terjadi kesalahan internal pada server saat menjalankan recurring billing cron",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return executeBillingInvoicesRoutine(request);
}

export async function POST(request: Request) {
  return executeBillingInvoicesRoutine(request);
}
