import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Notifikasi WhatsApp untuk alur Check-in dan Payout Mitra
 */

export async function notifyCheckinConfirmed(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  checkinTime: Date;
}) {
  const graceDeadline = new Date(params.checkinTime.getTime() + 12 * 60 * 60 * 1000);
  const message = [
    `[KosPasti] Halo ${params.tenantName}!`,
    `Mitra mengonfirmasi bahwa kamu sudah check-in di ${params.propertyName}.`,
    `Jika ada masalah atau kamu belum check-in, laporkan sebelum ${graceDeadline.toLocaleString("id-ID")}.`,
    `Hubungi: support@kospasti.com`,
  ].join("\n");

  console.log(`[WA NOTIFICATION -> ${params.tenantWhatsapp}]`);
  console.log(message);

  try {
    if (params.tenantWhatsapp) {
      await sendWhatsAppMessage({ to: params.tenantWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA check-in:", err);
  }
}

export async function notifyPayoutProcessed(params: {
  ownerName: string;
  ownerWhatsapp: string;
  amount: number;
  bankName: string;
  accountNumber: string;
}) {
  const message = [
    `[KosPasti] Halo ${params.ownerName}!`,
    `Dana sebesar Rp ${params.amount.toLocaleString("id-ID")} sudah dicairkan`,
    `ke rekening ${params.bankName} ${params.accountNumber}.`,
    `Dana akan masuk dalam 1-2 hari kerja.`,
    `Terima kasih telah bermitra dengan KosPasti!`,
  ].join("\n");

  console.log(`[WA NOTIFICATION -> ${params.ownerWhatsapp}]`);
  console.log(message);

  try {
    if (params.ownerWhatsapp) {
      await sendWhatsAppMessage({ to: params.ownerWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA payout:", err);
  }
}
