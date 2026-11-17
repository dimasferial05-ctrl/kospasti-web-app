import crypto from "crypto";

export const SERVICE_FEE = 5000;
export const DEFAULT_TAKE_RATE = 0.03; // 3% potongan komisi pemilik kos

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

export function getMidtransServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi di environment variables (.env).");
  }
  return key;
}

export function getMidtransClientKey(): string {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    process.env.MIDTRANS_CLIENT_KEY ||
    ""
  );
}

export function getMidtransSnapUrl(): string {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

export function getMidtransSnapScriptUrl(): string {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export interface SnapItemDetail {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SnapCustomerDetails {
  first_name: string;
  email?: string;
  phone?: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: SnapCustomerDetails;
  itemDetails: SnapItemDetail[];
  expiryMinutes?: number;
}

export interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
}

/**
 * Membuat transaksi Snap Midtrans dan mengembalikan token serta redirect_url
 */
export async function createSnapTransaction(
  params: CreateSnapTransactionParams
): Promise<SnapTransactionResponse> {
  const serverKey = getMidtransServerKey();
  const snapUrl = getMidtransSnapUrl();

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.first_name,
      email: params.customerDetails.email || undefined,
      phone: params.customerDetails.phone || undefined,
    },
    item_details: params.itemDetails.map((item) => ({
      id: item.id.substring(0, 50),
      name: item.name.substring(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    // Kanal pembayaran ramah mahasiswa: QRIS & VA Bank Nasional
    enabled_payments: [
      "gopay",
      "shopeepay",
      "qris",
      "bca_va",
      "bni_va",
      "bri_va",
      "mandiri_bill",
      "permata_va",
      "other_va",
    ],
  };

  if (params.expiryMinutes && params.expiryMinutes > 0) {
    payload.expiry = {
      unit: "minutes",
      duration: params.expiryMinutes,
    };
  }

  const response = await fetch(snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const errorMsg =
      Array.isArray(responseBody?.error_messages)
        ? responseBody.error_messages.join(", ")
        : responseBody?.message || "Gagal membuat transaksi Snap Midtrans";
    throw new Error(`Midtrans API Error (${response.status}): ${errorMsg}`);
  }

  return {
    token: responseBody.token,
    redirect_url: responseBody.redirect_url,
  };
}

/**
 * Validasi Signature Key SHA-512 dari Webhook HTTP Notification Midtrans
 * Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string | number,
  signatureKey: string
): boolean {
  try {
    const serverKey = getMidtransServerKey();
    const keysToTry = [serverKey];

    // Tambahkan Signature Key sekunder jika dikonfigurasi di dashboard
    if (
      process.env.MIDTRANS_SIGNATURE_KEY &&
      !keysToTry.includes(process.env.MIDTRANS_SIGNATURE_KEY)
    ) {
      keysToTry.push(process.env.MIDTRANS_SIGNATURE_KEY);
    }

    for (const key of keysToTry) {
      // 1. Coba hash pertama dengan nilai gross_amount apa adanya
      const rawString = `${orderId}${statusCode}${grossAmount}${key}`;
      const calculatedSignature = crypto
        .createHash("sha512")
        .update(rawString)
        .digest("hex");

      if (
        calculatedSignature.length === signatureKey.length &&
        crypto.timingSafeEqual(
          Buffer.from(calculatedSignature, "utf-8"),
          Buffer.from(signatureKey, "utf-8")
        )
      ) {
        return true;
      }

      // 2. Coba alternatif format desimal (.00 atau integer)
      const strAmount = String(grossAmount);
      const altAmount = strAmount.includes(".")
        ? strAmount.split(".")[0]
        : `${strAmount}.00`;
      const altRawString = `${orderId}${statusCode}${altAmount}${key}`;
      const altSignature = crypto
        .createHash("sha512")
        .update(altRawString)
        .digest("hex");

      if (
        altSignature.length === signatureKey.length &&
        crypto.timingSafeEqual(
          Buffer.from(altSignature, "utf-8"),
          Buffer.from(signatureKey, "utf-8")
        )
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Kesalahan saat validasi signature Midtrans:", error);
    return false;
  }
}

/**
 * Menghitung komisi platform (Take Rate) saat pencairan sewa ke pemilik kos
 */
export function calculatePlatformCommission(
  rentAmount: number,
  rate: number = DEFAULT_TAKE_RATE
): {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
} {
  const safeRent = Math.max(0, rentAmount);
  const platformFee = Math.round(safeRent * rate);
  const netAmount = Math.max(0, safeRent - platformFee);

  return {
    grossAmount: safeRent,
    platformFee,
    netAmount,
  };
}

/**
 * Evaluasi status notifikasi Midtrans ke status pesanan KosPasti
 */
export function evaluateMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): "PAID" | "PENDING" | "CANCELLED" | "UNKNOWN" {
  const status = transactionStatus?.toLowerCase();
  const fraud = fraudStatus?.toLowerCase();

  if (status === "capture") {
    if (fraud === "challenge") {
      return "PENDING";
    }
    if (fraud === "accept") {
      return "PAID";
    }
  }

  if (status === "settlement") {
    return "PAID";
  }

  if (status === "pending") {
    return "PENDING";
  }

  if (
    status === "deny" ||
    status === "cancel" ||
    status === "expire" ||
    status === "failure"
  ) {
    return "CANCELLED";
  }

  return "UNKNOWN";
}
