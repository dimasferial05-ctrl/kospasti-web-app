/**
 * WhatsApp Notification Service for KosPasti
 * Integrates with Fonnte API (or falls back to mock console logger in development)
 */

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";

  // Remove any non-numeric characters (spaces, dashes, plus, etc.)
  let cleaned = phone.replace(/\D/g, "");

  // Convert Indonesian phone format
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

export interface SendWhatsAppParams {
  to: string;
  message: string;
  skipDeviceCheck?: boolean; // Opsional: jika caller sudah melakukan pre-flight check device di awal batch
}

export interface SendWhatsAppResult {
  success: boolean;
  simulated?: boolean;
  data?: unknown;
  error?: string;
}

export interface DeviceStatusCacheEntry {
  status: boolean;
  expiresAt: number;
}

export interface CheckDeviceStatusOptions {
  forceRefresh?: boolean;
  ttlMs?: number;
}

// TTL default cache status device: 60 detik (1 menit)
export const DEFAULT_DEVICE_STATUS_CACHE_TTL_MS = 60 * 1000;

// In-memory cache map per token Fonnte
const deviceStatusCache = new Map<string, DeviceStatusCacheEntry>();

/**
 * Membersihkan cache status device (berguna untuk testing atau force reset).
 */
export function clearDeviceStatusCache(): void {
  deviceStatusCache.clear();
}

export async function checkFonnteDeviceStatus(
  token: string,
  options?: CheckDeviceStatusOptions
): Promise<boolean> {
  const trimmedToken = token.trim();
  const now = Date.now();
  const ttl = options?.ttlMs ?? DEFAULT_DEVICE_STATUS_CACHE_TTL_MS;

  // 1. Cek apakah status yang masih valid tersedia di cache
  if (!options?.forceRefresh) {
    const cached = deviceStatusCache.get(trimmedToken);
    if (cached && now < cached.expiresAt) {
      return cached.status;
    }
  }

  // 2. Jika tidak ada di cache atau expired, lakukan request HTTP ke Fonnte
  try {
    const response = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: {
        Authorization: trimmedToken,
      },
    });

    const result = await response.json().catch(() => null);

    // Status perangkat bisa berupa "connect" atau "disconnect"
    const isConnected = result?.device_status === "connect";

    // 3. Simpan hasil ke cache
    deviceStatusCache.set(trimmedToken, {
      status: isConnected,
      expiresAt: now + ttl,
    });

    return isConnected;
  } catch (error) {
    console.error("[WHATSAPP DEVICE ERROR] Gagal mengecek status device:", error);
    // Jika terjadi error jaringan, simpan false dengan TTL singkat (10 detik)
    deviceStatusCache.set(trimmedToken, {
      status: false,
      expiresAt: now + 10 * 1000,
    });
    return false; // Asumsikan disconnected demi keamanan jika terjadi error
  }
}

export async function sendWhatsAppMessage({
  to,
  message,
  skipDeviceCheck,
}: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const token = process.env.FONNTE_TOKEN || process.env.WHATSAPP_TOKEN;
  const formattedNumber = formatWhatsAppNumber(to);

  if (!formattedNumber) {
    console.warn("[WHATSAPP] Nomor telepon tujuan tidak valid:", to);
    return {
      success: false,
      error: "Nomor WhatsApp tujuan tidak valid",
    };
  }

  // If no token provided, log a simulated message in development mode
  if (!token || token.trim() === "") {
    console.log("\n================ [WHATSAPP SIMULATION] ================");
    console.log(`📱 TO      : ${formattedNumber} (${to})`);
    console.log(`💬 MESSAGE :\n${message}`);
    console.log("========================================================\n");
    return {
      success: true,
      simulated: true,
      data: { message: "Simulasi pengiriman WhatsApp berhasil dicatat di server log." },
    };
  }

  // Validasi status device Fonnte sebelum mengirim pesan (kecuali jika di-skip)
  if (!skipDeviceCheck) {
    const isDeviceConnected = await checkFonnteDeviceStatus(token);

    if (!isDeviceConnected) {
      console.warn(
        "[WHATSAPP ABORTED] Device Fonnte sedang terputus (disconnected). Pesan dibatalkan untuk menghemat kuota."
      );
      return {
        success: false,
        error: "Sistem pengiriman pesan sedang offline. Device WhatsApp tidak terhubung.",
      };
    }
  }

  try {
    const formData = new URLSearchParams();
    formData.append("target", formattedNumber);
    formData.append("message", message);
    formData.append("countryCode", "62"); // default Indonesia

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token.trim(),
      },
      body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || (result && result.status === false)) {
      console.error("[WHATSAPP ERROR] Gagal mengirim pesan via Fonnte:", result);
      return {
        success: false,
        error: result?.reason || "Gagal mengirim pesan melalui API WhatsApp",
        data: result,
      };
    }

    console.log(`[WHATSAPP SUCCESS] Pesan berhasil dikirim ke ${formattedNumber}`);
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[WHATSAPP EXCEPTION] Kesalahan jaringan saat kirim WA:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
