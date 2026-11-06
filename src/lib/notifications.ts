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


export async function notifyMoveInReminder(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  propertyAddress?: string | null;
  moveInDate: Date;
  ownerName?: string | null;
  ownerWhatsapp?: string | null;
  bookingId: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.id").replace(/\/+$/, "");
  const receiptUrl = `${baseUrl}/receipt/${params.bookingId}`;
  const moveInDateFormatted = params.moveInDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = [
    `[KosPasti] Halo ${params.tenantName}! 🏡`,
    `Besok adalah jadwal kamu mulai menempati kamar di *${params.propertyName}*.`,
    ...(params.propertyAddress ? [`📍 Alamat: ${params.propertyAddress}`] : []),
    `📅 Tanggal Masuk: ${moveInDateFormatted}`,
    ...(params.ownerName ? [`👤 Pemilik/Pengelola: ${params.ownerName} ${params.ownerWhatsapp ? `(${params.ownerWhatsapp})` : ""}`] : []),
    ``,
    `📋 Siapkan KTP/KTM & hubungi pemilik kos sebelum tiba.`,
    `Tunjukkan Kuitansi/Voucher resmi saat serah terima kunci:`,
    `${receiptUrl}`,
    ``,
    `Garansi escrow KosPasti melindungi kamarmu selama 12 jam setelah check-in!`,
  ];

  const message = lines.join("\n");

  console.log(`[WA NOTIFICATION -> ${params.tenantWhatsapp}]`);
  console.log(message);

  try {
    if (params.tenantWhatsapp) {
      await sendWhatsAppMessage({ to: params.tenantWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA pengingat H-1:", err);
  }
}

export async function notifyReviewPrompt(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  propertyId: string;
  bookingId: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.id").replace(/\/+$/, "");
  const reviewUrl = `${baseUrl}/kos/${params.propertyId}?review=true`;

  const message = [
    `[KosPasti] Halo ${params.tenantName}! ⭐`,
    `Sudah 2 hari nih kamu tinggal di *${params.propertyName}*. Gimana pengalamanmu?`,
    ``,
    `Yuk bagikan ulasan dan rating jujurmu untuk membantu calon anak kos lainnya:`,
    `${reviewUrl}`,
    ``,
    `Terima kasih sudah memilih KosPasti!`,
  ].join("\n");

  console.log(`[WA NOTIFICATION -> ${params.tenantWhatsapp}]`);
  console.log(message);

  try {
    if (params.tenantWhatsapp) {
      await sendWhatsAppMessage({ to: params.tenantWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA ajakan ulasan:", err);
  }
}

export async function notifyEscrowReleased(params: {
  ownerName: string;
  ownerWhatsapp: string;
  tenantName: string;
  propertyName: string;
  amount: number;
}) {
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(params.amount);

  const message = [
    `[KosPasti] Halo Mitra ${params.ownerName}! 💰`,
    `Masa garansi 12 jam pasca check-in untuk penyewa *${params.tenantName}* di *${params.propertyName}* telah selesai tanpa kendala/laporan.`,
    `Dana sewa sebesar ${formattedAmount} telah dilepaskan dari escrow dan siap dicairkan (PAYOUT_PENDING).`,
    `Tim keuangan kami akan memproses pencairan ke rekening terdaftar Anda.`,
    ``,
    `Terima kasih telah memberikan pelayanan terbaik bersama KosPasti!`,
  ].join("\n");

  console.log(`[WA NOTIFICATION -> ${params.ownerWhatsapp}]`);
  console.log(message);

  try {
    if (params.ownerWhatsapp) {
      await sendWhatsAppMessage({ to: params.ownerWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA pelepasan escrow:", err);
  }
}
