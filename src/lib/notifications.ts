import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "BOOKING_STATUS"
  | "PAYMENT_SUCCESS"
  | "CHECKIN_REMINDER"
  | "REVIEW_REPLY"
  | "PAYOUT_UPDATE"
  | "VISIT_SCHEDULE"
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

export async function notifyVisitRequested(params: {
  visitId: string;
  propertyId: string;
  propertyName: string;
  ownerId: string;
  ownerName: string;
  ownerWhatsapp?: string | null;
  userId?: string | null;
  studentName: string;
  studentWhatsapp: string;
  visitDateFormatted: string;
  visitTimeSlot: string;
  notes?: string | null;
  verificationUrl: string;
}) {
  const tasks: Promise<unknown>[] = [];

  tasks.push(
    createInAppNotification({
      ownerId: params.ownerId,
      title: "Permintaan Survei Lokasi Baru",
      message: `${params.studentName} mengajukan survei kos di ${params.propertyName} pada ${params.visitDateFormatted} (${params.visitTimeSlot}).`,
      type: "VISIT_SCHEDULE",
      link: "/partner/dashboard/visits",
    })
  );

  if (params.userId) {
    tasks.push(
      createInAppNotification({
        userId: params.userId,
        title: "Jadwal Survei Diajukan",
        message: `Permintaan survei lokasi di ${params.propertyName} (${params.visitDateFormatted}, ${params.visitTimeSlot}) telah dikirim ke pemilik kos.`,
        type: "VISIT_SCHEDULE",
        link: "/profil?tab=visits",
      })
    );
  }

  if (params.ownerWhatsapp) {
    const ownerMessage = [
      `Halo Bapak/Ibu *${params.ownerName}*,`,
      ``,
      `Ada calon penyewa yang ingin *Survei Lokasi Kos* di *${params.propertyName}*:`,
      `Nama: *${params.studentName}*`,
      `WhatsApp: ${params.studentWhatsapp}`,
      `Tanggal: *${params.visitDateFormatted}*`,
      `Jam Kunjungan: *${params.visitTimeSlot}*`,
      params.notes ? `Catatan: ${params.notes}` : ``,
      ``,
      `Klik tautan satu-klik berikut (tanpa perlu login) untuk *Terima*, *Tolak*, atau *Jadwalkan Ulang*:`,
      `${params.verificationUrl}`,
      ``,
      `_Tautan ini berlaku selama 48 jam._`,
    ]
      .filter(Boolean)
      .join("\n");

    tasks.push(
      sendWhatsAppMessage({
        to: params.ownerWhatsapp,
        message: ownerMessage,
      }).catch((err) => {
        console.error("[NOTIFICATION ERROR] Gagal mengirim WA pengajuan survei:", err);
      })
    );
  }

  await Promise.all(tasks);
}

export async function notifyVisitDecision(params: {
  action: "ACCEPT" | "REJECT" | "RESCHEDULE";
  propertyId: string;
  propertyName: string;
  propertyAddress?: string | null;
  ownerName: string;
  ownerWhatsapp?: string | null;
  userId?: string | null;
  studentName: string;
  studentWhatsapp: string;
  visitDateFormatted: string;
  visitTimeSlot: string;
  rescheduleDateFormatted?: string | null;
  rescheduleTimeSlot?: string | null;
  note?: string | null;
}) {
  const tasks: Promise<unknown>[] = [];

  let inAppTitle = "Pembaruan Jadwal Survei";
  let inAppMessage = "";
  let waLines: string[] = [];

  if (params.action === "ACCEPT") {
    inAppTitle = "Jadwal Survei Disetujui";
    inAppMessage = `Pemilik ${params.propertyName} (${params.ownerName}) menyetujui jadwal survei Anda pada ${params.visitDateFormatted} pukul ${params.visitTimeSlot}.`;
    waLines = [
      `Halo *${params.studentName}*,`,
      ``,
      `Kabar baik! Jadwal survei lokasi Anda di *${params.propertyName}* telah *DISETUJUI* oleh pemilik kos (*${params.ownerName}*).`,
      ``,
      `Detail Kunjungan:`,
      `Tanggal: *${params.visitDateFormatted}*`,
      `Jam: *${params.visitTimeSlot}*`,
      `Alamat: ${params.propertyAddress || "Lihat detail lokasi di halaman KosPasti"}`,
      params.ownerWhatsapp ? `Kontak Pengelola: ${params.ownerWhatsapp}` : ``,
      params.note ? `Catatan Pemilik: ${params.note}` : ``,
      ``,
      `Jika ingin langsung mengamankan kamar setelah survei, gunakan tombol *Amankan Kamar* di KosPasti untuk perlindungan Escrow 12 jam!`,
    ];
  } else if (params.action === "RESCHEDULE") {
    inAppTitle = "Pemilik Mengusulkan Jadwal Survei Baru";
    inAppMessage = `Pemilik ${params.propertyName} mengusulkan jadwal ulang survei ke ${params.rescheduleDateFormatted || params.visitDateFormatted} (${params.rescheduleTimeSlot || params.visitTimeSlot}).`;
    waLines = [
      `Halo *${params.studentName}*,`,
      ``,
      `Pemilik *${params.propertyName}* (*${params.ownerName}*) mengusulkan *JADWAL ULANG* untuk survei lokasi Anda.`,
      ``,
      `Usulan Jadwal Baru:`,
      `Tanggal: *${params.rescheduleDateFormatted || params.visitDateFormatted}*`,
      `Jam: *${params.rescheduleTimeSlot || params.visitTimeSlot}*`,
      params.note ? `Catatan Pemilik: ${params.note}` : ``,
      params.ownerWhatsapp ? `Hubungi Pengelola via WA: ${params.ownerWhatsapp}` : ``,
      ``,
      `Anda juga dapat mengajukan jadwal lain di halaman KosPasti jika waktu tersebut belum sesuai.`,
    ];
  } else {
    inAppTitle = "Jadwal Survei Belum Dapat Dipenuhi";
    inAppMessage = `Mohon maaf, pengajuan survei di ${params.propertyName} pada ${params.visitDateFormatted} ditolak.${params.note ? ` Alasan: ${params.note}` : ""}`;
    waLines = [
      `Halo *${params.studentName}*,`,
      ``,
      `Mohon maaf, jadwal survei lokasi Anda di *${params.propertyName}* pada ${params.visitDateFormatted} (${params.visitTimeSlot}) belum dapat disetujui oleh pemilik kos (*${params.ownerName}*).`,
      params.note ? `Alasan: ${params.note}` : ``,
      ``,
      `Anda dapat mencoba memilih hari lain atau jelajahi kos nyaman lainnya di KosPasti.`,
    ];
  }

  if (params.userId) {
    tasks.push(
      createInAppNotification({
        userId: params.userId,
        title: inAppTitle,
        message: inAppMessage,
        type: "VISIT_SCHEDULE",
        link: "/profil?tab=visits",
      })
    );
  }

  if (params.studentWhatsapp) {
    tasks.push(
      sendWhatsAppMessage({
        to: params.studentWhatsapp,
        message: waLines.filter(Boolean).join("\n"),
      }).catch((err) => {
        console.error("[NOTIFICATION ERROR] Gagal mengirim WA keputusan survei:", err);
      })
    );
  }

  await Promise.all(tasks);
}

export async function notifyVisitRescheduledByStudent(params: {
  propertyName: string;
  ownerId: string;
  ownerName: string;
  ownerWhatsapp?: string | null;
  userId?: string | null;
  studentName: string;
  studentWhatsapp: string;
  newVisitDateFormatted: string;
  newVisitTimeSlot: string;
  note?: string | null;
  verificationUrl: string;
}) {
  const tasks: Promise<unknown>[] = [];

  tasks.push(
    createInAppNotification({
      ownerId: params.ownerId,
      title: "Perubahan Jadwal Survei dari Calon Penyewa",
      message: `${params.studentName} mengubah jadwal survei di ${params.propertyName} menjadi ${params.newVisitDateFormatted} (${params.newVisitTimeSlot}). Mohon konfirmasi ulang.`,
      type: "VISIT_SCHEDULE",
      link: "/partner/dashboard/visits",
    })
  );

  if (params.userId) {
    tasks.push(
      createInAppNotification({
        userId: params.userId,
        title: "Perubahan Jadwal Survei Dikirim",
        message: `Usulan jadwal baru di ${params.propertyName} (${params.newVisitDateFormatted}, ${params.newVisitTimeSlot}) telah dikirim ke pemilik kos.`,
        type: "VISIT_SCHEDULE",
        link: "/profil?tab=visits",
      })
    );
  }

  if (params.ownerWhatsapp) {
    const ownerMessage = [
      `Halo Bapak/Ibu *${params.ownerName}*,`,
      ``,
      `Calon penyewa *${params.studentName}* (${params.studentWhatsapp}) mengajukan *PERUBAHAN JADWAL SURVEI* di *${params.propertyName}*:`,
      `Tanggal Baru: *${params.newVisitDateFormatted}*`,
      `Jam Kunjungan Baru: *${params.newVisitTimeSlot}*`,
      params.note ? `Alasan / Catatan: ${params.note}` : ``,
      ``,
      `Silakan konfirmasi ulang (*Terima*, *Tolak*, atau *Jadwalkan Ulang*) melalui tautan berikut:`,
      `${params.verificationUrl}`,
      ``,
      `_Tautan berlaku selama 48 jam._`,
    ]
      .filter(Boolean)
      .join("\n");

    tasks.push(
      sendWhatsAppMessage({
        to: params.ownerWhatsapp,
        message: ownerMessage,
      }).catch((err) => {
        console.error("[NOTIFICATION ERROR] Gagal mengirim WA ubah jadwal survei:", err);
      })
    );
  }

  await Promise.all(tasks);
}

/**
 * Notifikasi Pengingat Pembayaran Sewa Mahasiswa (Payment Reminder)
 * Dikirim otomatis via cron jika pesanan PENDING belum dibayar dalam batas waktu 24 jam.
 */
export async function notifyPaymentReminder(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  roomTypeName?: string | null;
  amount: number;
  bookingId: string;
  createdAt: Date;
  userId?: string | null;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const paymentUrl = `${baseUrl.replace(/\/$/, "")}/checkout/${params.bookingId}`;

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(params.amount);

  const roomInfo = params.roomTypeName ? ` (${params.roomTypeName})` : "";

  // Pesan WhatsApp yang ramah, sopan, to-the-point, dan bebas emoji slop
  const waMessage = [
    `[KosPasti] Halo ${params.tenantName}!`,
    ``,
    `Pesanan kamar kos kamu di ${params.propertyName}${roomInfo} masih menunggu penyelesaian pembayaran sebesar ${formattedAmount}.`,
    ``,
    `Batas waktu pembayaran berlaku 24 jam sejak pesanan dibuat. Segera selesaikan pembayaran agar kamar kos pilihanmu tidak terlepas ke calon penyewa lain.`,
    ``,
    `Lanjutkan pembayaran melalui tautan berikut:`,
    paymentUrl,
    ``,
    `Jika kamu sudah melakukan pembayaran, silakan abaikan pesan ini. Butuh bantuan? Hubungi customer support kami di support@kospasti.com.`,
  ].join("\n");

  const tasks: Promise<unknown>[] = [];

  // 1. Notifikasi In-App untuk Mahasiswa
  if (params.userId) {
    tasks.push(
      createInAppNotification({
        userId: params.userId,
        title: "Menunggu Pembayaran Sewa",
        message: `Pesanan kamar kos Anda di ${params.propertyName} menunggu pembayaran (${formattedAmount}). Selesaikan sebelum batas waktu 24 jam berakhir.`,
        type: "BOOKING_STATUS",
        link: `/checkout/${params.bookingId}`,
      })
    );
  }

  // 2. Pesan WhatsApp melalui Fonnte / WhatsApp Service
  if (params.tenantWhatsapp) {
    console.log(`[PAYMENT REMINDER WA -> ${params.tenantWhatsapp}] Booking ID: ${params.bookingId}`);
    tasks.push(
      sendWhatsAppMessage({
        to: params.tenantWhatsapp,
        message: waMessage,
      }).catch((err) => {
        console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA payment reminder:", err);
      })
    );
  }

  await Promise.all(tasks);
}

export async function notifyDepositReleased(params: {
  tenantName: string;
  tenantWhatsapp: string;
  propertyName: string;
  depositAmount: number;
  refundedAmount: number;
  claimedAmount: number;
  claimReason?: string | null;
  userId?: string | null;
  bookingId?: string;
}) {
  const isFullyRefunded = params.claimedAmount === 0;
  const message = isFullyRefunded
    ? [
        `[KosPasti] Halo ${params.tenantName}!`,
        `Pemeriksaan kamar di ${params.propertyName} telah selesai. Kondisi kamar dinyatakan baik tanpa kerusakan.`,
        `Deposit jaminan sebesar Rp${params.refundedAmount.toLocaleString("id-ID")} telah dikembalikan dari sistem Escrow ke rekening Anda.`,
        `Terima kasih telah menyewa melalui KosPasti!`,
      ].join("\n")
    : [
        `[KosPasti] Halo ${params.tenantName}!`,
        `Pemeriksaan kamar di ${params.propertyName} telah selesai.`,
        `Terdapat klaim kerusakan fasilitas sebesar Rp${params.claimedAmount.toLocaleString("id-ID")}${params.claimReason ? ` (Alasan: ${params.claimReason})` : ""}.`,
        params.refundedAmount > 0
          ? `Sisa deposit sebesar Rp${params.refundedAmount.toLocaleString("id-ID")} telah dikembalikan ke rekening Anda.`
          : `Seluruh deposit digunakan untuk penggantian kerusakan fasilitas.`,
        `Rincian selengkapnya dapat dilihat di aplikasi KosPasti.`,
      ].join("\n");

  if (params.userId) {
    await createInAppNotification({
      userId: params.userId,
      title: isFullyRefunded ? "Deposit Dikembalikan" : "Deposit Selesai Diperiksa",
      message: isFullyRefunded
        ? `Deposit jaminan Rp${params.refundedAmount.toLocaleString("id-ID")} untuk ${params.propertyName} telah dikembalikan secara penuh.`
        : `Pemeriksaan kamar ${params.propertyName} selesai. Klaim kerusakan Rp${params.claimedAmount.toLocaleString("id-ID")}${params.refundedAmount > 0 ? `, sisa Rp${params.refundedAmount.toLocaleString("id-ID")} dikembalikan.` : "."}`,
      type: "BOOKING_STATUS",
      link: params.bookingId ? `/receipt/${params.bookingId}` : "/profil",
    });
  }

  try {
    if (params.tenantWhatsapp) {
      await sendWhatsAppMessage({ to: params.tenantWhatsapp, message });
    }
  } catch (err) {
    console.error("[NOTIFICATION ERROR] Gagal mengirim pesan WA deposit release:", err);
  }
}


