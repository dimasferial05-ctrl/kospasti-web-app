export interface CreateDisbursementParams {
  payoutId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string | null;
  ownerEmail?: string | null;
}

export interface CreateDisbursementResult {
  success: boolean;
  isSimulated: boolean;
  payoutId: string;
  disbursementId?: string;
  referenceNo?: string;
  status: string; // "completed" | "queued" | "failed"
  provider: string; // "MIDTRANS_IRIS"
  error?: string;
  rawResponse?: unknown;
}

/**
 * Normalisasi nama bank pengguna ke kode bank standar Midtrans Iris
 */
export function normalizeBankCode(bankName: string): string {
  const clean = (bankName || "").toLowerCase().trim();

  if (clean.includes("bca digital") || clean.includes("blu")) return "bca";
  if (clean.includes("bca") || clean.includes("central asia")) return "bca";
  if (clean.includes("mandiri") || clean.includes("livin")) return "mandiri";
  if (clean.includes("bni")) return "bni";
  if (clean.includes("bri") || clean.includes("brimo")) return "bri";
  if (clean.includes("cimb") || clean.includes("niaga")) return "cimb";
  if (clean.includes("permata")) return "permata";
  if (clean.includes("bsi") || clean.includes("syariah indonesia")) return "bsi";
  if (clean.includes("danamon")) return "danamon";
  if (clean.includes("btn")) return "btn";
  if (clean.includes("jago")) return "jago";
  if (clean.includes("seabank")) return "seabank";
  if (clean.includes("panin")) return "panin";
  if (clean.includes("ocbc")) return "ocbc";
  if (clean.includes("maybank")) return "maybank";
  if (clean.includes("mega")) return "mega";
  if (clean.includes("sinarmas")) return "sinarmas";
  if (clean.includes("gopay")) return "gopay";
  if (clean.includes("ovo")) return "ovo";
  if (clean.includes("dana")) return "dana";
  if (clean.includes("shopeepay")) return "shopeepay";

  // Fallback: hapus karakter non alfanumerik
  const fallback = clean.replace(/[^a-z0-9]/g, "");
  return fallback || "bca";
}

export function isIrisProduction(): boolean {
  return process.env.IRIS_IS_PRODUCTION === "true";
}

export function isIrisSimulation(): boolean {
  // Guard Keamanan Finansial: Cegah Fail-Open di Lingkungan Produksi
  if (process.env.NODE_ENV === "production") {
    if (process.env.IRIS_SIMULATION === "true") {
      throw new Error("FATAL: Mode simulasi IRIS_SIMULATION dilarang aktif pada mode produksi!");
    }
    if (!process.env.IRIS_API_KEY?.trim()) {
      throw new Error("FATAL: IRIS_API_KEY wajib dikonfigurasi pada mode produksi!");
    }
    return false;
  }

  // Lingkungan non-produksi (development / test)
  if (process.env.IRIS_SIMULATION === "true") return true;
  if (!process.env.IRIS_API_KEY?.trim()) return true;
  return false;
}

export function getIrisBaseUrl(): string {
  return isIrisProduction()
    ? "https://app.midtrans.com/iris/api/v1"
    : "https://app.sandbox.midtrans.com/iris/api/v1";
}

/**
 * Mengirimkan permintaan pencairan dana otomatis (Disbursement) ke rekening bank mitra
 * melalui Midtrans Iris atau Smart Simulator Fallback
 */
export async function createDisbursement(
  params: CreateDisbursementParams
): Promise<CreateDisbursementResult> {
  const { payoutId, amount, bankName, accountNumber, accountHolder, notes, ownerEmail } = params;

  // Guard Keamanan Finansial Produksi: Pastikan API Key ada & simulasi dilarang di produksi (Fail-Closed)
  if (process.env.NODE_ENV === "production") {
    if (process.env.IRIS_SIMULATION === "true") {
      throw new Error("FATAL: Mode simulasi IRIS_SIMULATION dilarang aktif pada mode produksi!");
    }
    if (!process.env.IRIS_API_KEY?.trim()) {
      throw new Error("FATAL: IRIS_API_KEY wajib dikonfigurasi pada mode produksi!");
    }
  }

  if (!payoutId || !amount || amount <= 0 || !bankName || !accountNumber || !accountHolder) {
    return {
      success: false,
      isSimulated: false,
      payoutId: payoutId || "unknown",
      status: "failed",
      provider: "MIDTRANS_IRIS",
      error: "Parameter pencairan tidak lengkap: nominal, nama bank, dan nomor rekening wajib diisi.",
    };
  }

  // 1. Mode Simulasi Cerdas (Smart Simulator Fallback)
  if (isIrisSimulation()) {
    const timestampStr = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockRefNo = `REF-IRIS-${timestampStr}-${randomSuffix}`;
    const mockDisbursementId = `IRIS-SIM-${payoutId.slice(0, 8).toUpperCase()}`;

    return {
      success: true,
      isSimulated: true,
      payoutId,
      disbursementId: mockDisbursementId,
      referenceNo: mockRefNo,
      status: "completed",
      provider: "MIDTRANS_IRIS",
      rawResponse: {
        mode: "simulation",
        beneficiary_name: accountHolder,
        beneficiary_account: accountNumber,
        bank: normalizeBankCode(bankName),
        amount,
        created_at: new Date().toISOString(),
      },
    };
  }

  // 2. Mode Live Midtrans Iris API (Sandbox / Production)
  const apiKey = process.env.IRIS_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      isSimulated: false,
      payoutId,
      status: "failed",
      provider: "MIDTRANS_IRIS",
      error: "IRIS_API_KEY belum dikonfigurasi di environment (.env).",
    };
  }

  const baseUrl = getIrisBaseUrl();
  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
  const irisBankCode = normalizeBankCode(bankName);
  const formattedAmount = Math.max(0, Math.round(amount)).toFixed(2);
  const cleanNotes = (notes || `Payout KosPasti ${payoutId.slice(0, 8)}`).substring(0, 100);

  const payload = {
    payouts: [
      {
        beneficiary_name: accountHolder.substring(0, 100),
        beneficiary_account: accountNumber.trim(),
        beneficiary_bank: irisBankCode,
        beneficiary_email: ownerEmail || undefined,
        amount: formattedAmount,
        notes: cleanNotes,
      },
    ],
  };

  try {
    const response = await fetch(`${baseUrl}/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
        // Header Idempotency untuk mencegah transfer ganda jika terjadi kegagalan jaringan
        "X-Idempotency-Key": `payout-${payoutId}`,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        responseBody?.error_message ||
        responseBody?.message ||
        (Array.isArray(responseBody?.errors) ? responseBody.errors.join(", ") : null) ||
        `Gateway error HTTP ${response.status}`;

      return {
        success: false,
        isSimulated: false,
        payoutId,
        status: "failed",
        provider: "MIDTRANS_IRIS",
        error: `Midtrans Iris API Gagal: ${errorMsg}`,
        rawResponse: responseBody,
      };
    }

    const firstPayout = responseBody?.payouts?.[0] || responseBody;
    const refNo = firstPayout?.reference_no || `IRIS-${Date.now()}`;
    const status = firstPayout?.status || "queued";

    return {
      success: true,
      isSimulated: false,
      payoutId,
      disbursementId: firstPayout?.id ? String(firstPayout.id) : `IRIS-${payoutId.slice(0, 8)}`,
      referenceNo: refNo,
      status: status === "rejected" ? "failed" : status,
      provider: "MIDTRANS_IRIS",
      rawResponse: responseBody,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Kesalahan koneksi ke Midtrans Iris";
    return {
      success: false,
      isSimulated: false,
      payoutId,
      status: "failed",
      provider: "MIDTRANS_IRIS",
      error: errorMsg,
    };
  }
}
