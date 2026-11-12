import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "BOOKING_STATUS"
  | "PAYMENT_SUCCESS"
  | "CHECKIN_REMINDER"
  | "REVIEW_REPLY"
  | "PAYOUT_UPDATE"
  | "SYSTEM";

export interface CreateInAppNotificationParams {
  userId?: string | null;
  ownerId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}

/**
 * Mencatat notifikasi In-App ke database agar selalu tampil pada Notification Bell
 * baik untuk Mahasiswa (userId) maupun Mitra Pemilik Kos (ownerId),
 * meskipun pengiriman pesan WhatsApp eksternal (Fonnte) gagal atau tertunda.
 */
export async function createInAppNotification(
  params: CreateInAppNotificationParams
) {
  try {
    if (!params.userId && !params.ownerId) {
      return null;
    }

    return await prisma.notification.create({
      data: {
        user_id: params.userId || null,
        owner_id: params.ownerId || null,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link || null,
      },
    });
  } catch (err) {
    console.error("[IN-APP NOTIFICATION ERROR] Gagal membuat notifikasi:", err);
    return null;
  }
}

/**
 * Notifikasi WhatsApp & In-App untuk alur Check-in dan Payout Mitra
 */

export async function notifyCheckinConfirmed(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  checkinTime: Date;
  userId?: string | null;
  bookingId?: string;
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

  if (params.userId) {
    await createInAppNotification({
      userId: params.userId,
      title: "Check-in Terkonfirmasi",
      message: `Mitra telah mengonfirmasi check-in Anda di ${params.propertyName}. Garansi escrow melindungi Anda selama 12 jam ke depan.`,
      type: "BOOKING_STATUS",
      link: params.bookingId ? `/receipt/${params.bookingId}` : "/profil",
    });
  }

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
  ownerId?: string | null;
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

  if (params.ownerId) {
    await createInAppNotification({
      ownerId: params.ownerId,
      title: "Dana Payout Telah Dicairkan",
      message: `Dana sebesar Rp ${params.amount.toLocaleString("id-ID")} sedang dicairkan ke rekening ${params.bankName} ${params.accountNumber}.`,
      type: "PAYOUT_UPDATE",
      link: "/partner/dashboard/payouts",
    });
  }

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
  moveInDate: Date | string;
  ownerName?: string | null;
  ownerWhatsapp?: string | null;
  bookingId: string;
  userId?: string | null;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.id").replace(/\/+$/, "");
  const receiptUrl = `${baseUrl}/receipt/${params.bookingId}`;
  const moveInDateObj = typeof params.moveInDate === "string" ? new Date(params.moveInDate) : params.moveInDate;
  const moveInDateFormatted = moveInDateObj.toLocaleDateString("id-ID", {
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

  if (params.userId) {
    await createInAppNotification({
      userId: params.userId,
      title: "Pengingat Check-in H-1",
      message: `Besok (${moveInDateFormatted}) adalah jadwal Anda mulai menempati kamar di ${params.propertyName}. Siapkan KTP dan kuitansi Anda.`,
      type: "CHECKIN_REMINDER",
      link: `/receipt/${params.bookingId}`,
    });
  }

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
  userId?: string | null;
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

  if (params.userId) {
    await createInAppNotification({
      userId: params.userId,
      title: "Bagikan Pengalaman Kos Anda",
      message: `Sudah 2 hari Anda menempati kamar di ${params.propertyName}. Yuk beri ulasan dan rating jujur Anda!`,
      type: "SYSTEM",
      link: `/kos/${params.propertyId}?review=true`,
    });
  }

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
  ownerId?: string | null;
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

  if (params.ownerId) {
    await createInAppNotification({
      ownerId: params.ownerId,
      title: "Dana Escrow Siap Dicairkan",
      message: `Masa garansi check-in ${params.tenantName} di ${params.propertyName} telah selesai. Dana ${formattedAmount} siap dicairkan ke rekening Anda.`,
      type: "PAYOUT_UPDATE",
      link: "/partner/dashboard/payouts",
    });
  }

  try {
    if (params.ownerWhatsapp) {
      await sendWhatsAppMessage({ to: params.ownerWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA pelepasan escrow:", err);
  }
}
