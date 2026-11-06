/**
 * Email Notification Service for KosPasti
 * Integrates with Resend REST API (or falls back to mock console logger in development)
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

export interface BookingReceiptEmailData {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  studentWhatsapp?: string;
  propertyName: string;
  propertyAddress?: string;
  roomTypeName?: string;
  moveInDate: string | Date;
  rentPrice: number;
  adminFee: number;
  totalPrice: number;
  status: string;
}

export interface BookingDecisionEmailData {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  propertyName: string;
  propertyAddress?: string;
  roomTypeName?: string;
  moveInDate: string | Date;
  action: "ACCEPT" | "REJECT";
  ownerName?: string;
  ownerWhatsapp?: string;
  reason?: string;
}

export interface MoveInReminderEmailData {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  propertyName: string;
  propertyAddress?: string;
  roomTypeName?: string;
  ownerName?: string;
  ownerWhatsapp?: string;
  moveInDate: string | Date;
}

export interface ReviewPromptEmailData {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  propertyName: string;
  propertyId: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateIndo(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Menghasilkan HTML kuitansi bukti pembayaran DP kos
 */
export function generateBookingReceiptHtml(data: BookingReceiptEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formattedMoveIn = formatDateIndo(data.moveInDate);
  const csWhatsapp = (process.env.NEXT_PUBLIC_CS_WHATSAPP_NUMBER || "6281234567890").replace(/\D/g, "");

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bukti Pembayaran KosPasti #${data.bookingId.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #059669; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 24px; }
    .greeting { font-size: 15px; margin-bottom: 16px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .card-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 0; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; }
    .row-val { font-weight: 600; text-align: right; color: #0f172a; }
    .total-row { padding-top: 10px; margin-top: 8px; border-top: 2px solid #cbd5e1; font-size: 15px; font-weight: 800; color: #059669; }
    .escrow-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 10px 10px 0; padding: 14px 16px; margin: 20px 0; font-size: 12px; color: #1e40af; }
    .btn-container { text-align: center; margin: 28px 0 14px; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KosPasti</h1>
      <p>Kuitansi Bukti Pembayaran Digital</p>
      <div class="badge">Pembayaran Berhasil (PAID)</div>
    </div>
    <div class="content">
      <p class="greeting">Halo <strong>${escapeHtml(data.studentName)}</strong>,</p>
      <p style="font-size: 13px; color: #475569;">
        Terima kasih telah melakukan pemesanan kamar kos melalui <strong>KosPasti</strong>. Pembayaran DP Anda telah kami terima dan pesanan Anda sedang diverifikasi oleh pemilik kos.
      </p>

      <div class="card">
        <div class="card-title">Ringkasan Pesanan</div>
        <div class="row">
          <span class="row-label">No. Pesanan:</span>
          <span class="row-val font-mono">#${escapeHtml(data.bookingId)}</span>
        </div>
        <div class="row">
          <span class="row-label">Nama Kos:</span>
          <span class="row-val">${escapeHtml(data.propertyName)}</span>
        </div>
        ${data.roomTypeName ? `
        <div class="row">
          <span class="row-label">Tipe Kamar:</span>
          <span class="row-val">${escapeHtml(data.roomTypeName)}</span>
        </div>` : ""}
        ${data.propertyAddress ? `
        <div class="row">
          <span class="row-label">Alamat:</span>
          <span class="row-val">${escapeHtml(data.propertyAddress)}</span>
        </div>` : ""}
        <div class="row">
          <span class="row-label">Rencana Masuk:</span>
          <span class="row-val">${formattedMoveIn}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Rincian Pembayaran</div>
        <div class="row">
          <span class="row-label">Sewa Kamar (DP):</span>
          <span class="row-val">${formatRupiah(data.rentPrice)}</span>
        </div>
        <div class="row">
          <span class="row-label">Biaya Layanan &amp; Verifikasi:</span>
          <span class="row-val">${formatRupiah(data.adminFee)}</span>
        </div>
        <div class="row total-row">
          <span class="row-label" style="color: #059669;">Total Pembayaran:</span>
          <span class="row-val" style="color: #059669;">${formatRupiah(data.totalPrice)}</span>
        </div>
      </div>

      <div class="escrow-box">
        <strong>🛡️ Garansi Penahanan Dana (Escrow 12 Jam):</strong><br>
        Uang Anda aman bersama KosPasti. Dana baru akan diteruskan ke pemilik kos 12 jam setelah Anda melakukan check-in dan memastikan kondisi kamar sesuai deskripsi.
      </div>

      <div class="btn-container">
        <a href="${baseUrl}/checkout/${data.bookingId}" class="btn">Lihat Status Pesanan</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Butuh bantuan atau konfirmasi langsung? <a href="https://wa.me/${csWhatsapp}?text=Halo%20CS%20KosPasti,%20saya%20butuh%20konfirmasi%20pesanan%20%23${data.bookingId}">Hubungi CS WhatsApp</a></p>
      <p style="margin: 0; font-size: 11px;">&copy; ${new Date().getFullYear()} KosPasti &bull; Platform Pencarian Kos Real-Time &amp; Aman</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Menghasilkan HTML notifikasi keputusan pemilik kos (Diterima / Ditolak)
 */
export function generateBookingDecisionHtml(data: BookingDecisionEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formattedMoveIn = formatDateIndo(data.moveInDate);
  const csWhatsapp = (process.env.NEXT_PUBLIC_CS_WHATSAPP_NUMBER || "6281234567890").replace(/\D/g, "");
  const isAccepted = data.action === "ACCEPT";

  const themeColor = isAccepted ? "#059669" : "#dc2626";
  const statusLabel = isAccepted ? "Pesanan Dikonfirmasi & Diterima" : "Pesanan Ditolak & Proses Pengembalian Dana";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAccepted ? "Kabar Baik!" : "Pembaruan"} Pesanan KosPasti #${data.bookingId.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: ${themeColor}; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background-color: #ffffff; color: ${themeColor}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; }
    .row-val { font-weight: 600; text-align: right; color: #0f172a; }
    .btn-container { text-align: center; margin: 28px 0 14px; }
    .btn { display: inline-block; background-color: ${themeColor}; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KosPasti</h1>
      <p>Pemberitahuan Status Pesanan</p>
      <div class="badge">${statusLabel}</div>
    </div>
    <div class="content">
      <p>Halo <strong>${escapeHtml(data.studentName)}</strong>,</p>
      ${isAccepted ? `
      <p style="font-size: 14px; color: #334155;">
        Kabar gembira! 🎉 Pemilik kos <strong>${escapeHtml(data.ownerName || "Bapak/Ibu Kos")}</strong> telah <strong>menerima dan mengonfirmasi</strong> pesanan kamar Anda di <strong>${escapeHtml(data.propertyName)}</strong>.
      </p>
      ` : `
      <p style="font-size: 14px; color: #334155;">
        Mohon maaf, pemilik kos belum dapat menerima pesanan Anda di <strong>${escapeHtml(data.propertyName)}</strong> ${data.reason ? `dengan alasan: <em>${escapeHtml(data.reason)}</em>` : ""}.
      </p>
      <p style="font-size: 13px; color: #475569; background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px;">
        <strong>Informasi Pengembalian Dana:</strong> Seluruh pembayaran DP dan biaya layanan akan dikembalikan 100% tanpa potongan. Tim kami akan segera menghubungi Anda.
      </p>
      `}

      <div class="card">
        <div class="row">
          <span class="row-label">No. Pesanan:</span>
          <span class="row-val font-mono">#${escapeHtml(data.bookingId)}</span>
        </div>
        <div class="row">
          <span class="row-label">Nama Properti:</span>
          <span class="row-val">${escapeHtml(data.propertyName)}</span>
        </div>
        ${data.roomTypeName ? `
        <div class="row">
          <span class="row-label">Tipe Kamar:</span>
          <span class="row-val">${escapeHtml(data.roomTypeName)}</span>
        </div>` : ""}
        <div class="row">
          <span class="row-label">Rencana Masuk:</span>
          <span class="row-val">${formattedMoveIn}</span>
        </div>
        ${isAccepted && data.ownerWhatsapp ? `
        <div class="row">
          <span class="row-label">WhatsApp Pemilik:</span>
          <span class="row-val">${data.ownerWhatsapp}</span>
        </div>` : ""}
      </div>

      <div class="btn-container">
        <a href="${baseUrl}/profil?tab=bookings" class="btn">${isAccepted ? "Buka Riwayat Pesanan" : "Cari Kos Lainnya"}</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Pertanyaan seputar pesanan? <a href="https://wa.me/${csWhatsapp}?text=Halo%20CS%20KosPasti,%20saya%20ingin%20bertanya%20mengenai%20status%20pesanan%20%23${data.bookingId}">Hubungi CS WhatsApp</a></p>
      <p style="margin: 0; font-size: 11px;">&copy; ${new Date().getFullYear()} KosPasti</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mengirim email menggunakan Resend API (atau fallback simulator logger jika API key belum diatur)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "KosPasti <onboarding@resend.dev>";

  // Validasi format email dasar
  if (!to || !to.includes("@")) {
    console.warn("[EMAIL SERVICE] Alamat email penerima tidak valid:", to);
    return {
      success: false,
      error: "Alamat email tujuan tidak valid",
    };
  }

  // Jika tidak ada API key, gunakan mode simulasi (mock logger) untuk local dev & test
  if (!apiKey || apiKey.trim() === "") {
    console.log("\n================ [EMAIL SIMULATION] ================");
    console.log(`📧 TO      : ${to}`);
    console.log(`📝 SUBJECT : ${subject}`);
    console.log(`✉️ FROM    : ${fromEmail}`);
    console.log(`📄 PREVIEW : ${text ? text.slice(0, 100) : "HTML content rendered"}`);
    console.log("====================================================\n");

    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to.trim()],
        subject: subject.trim(),
        html,
        text: text || "Silakan aktifkan tampilan HTML untuk melihat isi email ini.",
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("[EMAIL ERROR] Gagal mengirim email via Resend:", result);
      return {
        success: false,
        error: result?.message || `HTTP ${response.status}: Gagal mengirim email`,
      };
    }

    console.log(`[EMAIL SUCCESS] Email berhasil dikirim ke ${to} (ID: ${result?.id})`);
    return {
      success: true,
      messageId: result?.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[EMAIL EXCEPTION] Kesalahan jaringan saat kirim email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Helper spesifik: Kirim bukti pembayaran kuitansi kos ke email mahasiswa
 */
export async function sendBookingReceiptEmail(
  data: BookingReceiptEmailData
): Promise<SendEmailResult> {
  const subject = `Bukti Pembayaran DP KosPasti - ${data.propertyName} #${data.bookingId.slice(0, 8)}`;
  const html = generateBookingReceiptHtml(data);
  const text = `Halo ${data.studentName}, pembayaran DP pemesanan kamar di ${data.propertyName} sebesar ${formatRupiah(data.totalPrice)} telah berhasil (Booking ID: #${data.bookingId}).`;

  return sendEmail({
    to: data.studentEmail,
    subject,
    html,
    text,
  });
}


/**
 * Helper spesifik: Kirim email pembaruan status konfirmasi pemilik kos
 */
export async function sendBookingDecisionEmail(
  data: BookingDecisionEmailData
): Promise<SendEmailResult> {
  const isAccepted = data.action === "ACCEPT";
  const subject = isAccepted
    ? `Kabar Baik! Pesanan Anda di ${data.propertyName} Telah Dikonfirmasi`
    : `Pembaruan Status Pesanan Kos di ${data.propertyName}`;

  const html = generateBookingDecisionHtml(data);
  const text = isAccepted
    ? `Halo ${data.studentName}, pesanan kamar Anda di ${data.propertyName} telah diterima oleh pemilik kos.`
    : `Halo ${data.studentName}, pemilik kos ${data.propertyName} belum dapat menerima pesanan Anda. Seluruh dana akan dikembalikan 100%.`;

  return sendEmail({
    to: data.studentEmail,
    subject,
    html,
    text,
  });
}




/**
 * Menghasilkan HTML pengingat H-1 masuk kos untuk mahasiswa
 */
export function generateMoveInReminderHtml(data: MoveInReminderEmailData): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.id").replace(/\/+$/, "");
  const formattedMoveIn = formatDateIndo(data.moveInDate);
  const receiptUrl = `${baseUrl}/receipt/${data.bookingId}`;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat H-1 Masuk Kos - ${escapeHtml(data.propertyName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #059669; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 24px; }
    .greeting { font-size: 15px; margin-bottom: 16px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; }
    .row-val { font-weight: 600; text-align: right; color: #0f172a; }
    .checklist { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px; color: #166534; }
    .checklist li { margin-bottom: 6px; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KosPasti</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Pengingat Jadwal Masuk Kos</p>
      <div class="badge">Besok Hari Pertama Check-in! 🏡</div>
    </div>
    <div class="content">
      <p class="greeting">Halo <strong>${escapeHtml(data.studentName)}</strong>,</p>
      <p style="font-size: 13px; color: #475569;">
        Besok adalah jadwal kamu mulai menempati kamar di <strong>${escapeHtml(data.propertyName)}</strong>. Pastikan persiapan kedatanganmu berjalan lancar!
      </p>

      <div class="card">
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">
          Rincian Kedatangan
        </div>
        <div class="row">
          <span class="row-label">Nama Properti:</span>
          <span class="row-val">${escapeHtml(data.propertyName)}</span>
        </div>
        ${data.roomTypeName ? `
        <div class="row">
          <span class="row-label">Tipe Kamar:</span>
          <span class="row-val">${escapeHtml(data.roomTypeName)}</span>
        </div>` : ""}
        ${data.propertyAddress ? `
        <div class="row">
          <span class="row-label">Alamat Lengkap:</span>
          <span class="row-val">${escapeHtml(data.propertyAddress)}</span>
        </div>` : ""}
        <div class="row">
          <span class="row-label">Tanggal Masuk:</span>
          <span class="row-val" style="color: #059669; font-weight: 700;">${formattedMoveIn}</span>
        </div>
        ${data.ownerName ? `
        <div class="row">
          <span class="row-label">Pemilik/Pengelola:</span>
          <span class="row-val">${escapeHtml(data.ownerName)} ${data.ownerWhatsapp ? `(${escapeHtml(data.ownerWhatsapp)})` : ""}</span>
        </div>` : ""}
      </div>

      <div class="checklist">
        <strong>📋 Hal yang Perlu Disiapkan Besok:</strong>
        <ul style="margin: 8px 0 0; padding-left: 18px;">
          <li>Bawa kartu identitas resmi (KTP atau Kartu Tanda Mahasiswa).</li>
          <li>Hubungi Ibu/Bapak Kos via WhatsApp sebelum tiba untuk konfirmasi perkiraan jam sampai.</li>
          <li>Tunjukkan Kuitansi/Voucher Booking resmi KosPasti saat serah terima kunci.</li>
          <li>Periksa kondisi kamar dan nikmati perlindungan garansi escrow 12 jam KosPasti.</li>
        </ul>
      </div>

      <div class="btn-container">
        <a href="${receiptUrl}" class="btn" target="_blank">Lihat &amp; Cetak Kuitansi Voucher</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">KosPasti - Platform Sewa Kos Terpercaya &bull; Butuh bantuan? Hubungi CS kami di WhatsApp.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Menghasilkan HTML ajakan ulasan hari ke-2 untuk mahasiswa
 */
export function generateReviewPromptHtml(data: ReviewPromptEmailData): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.id").replace(/\/+$/, "");
  const reviewUrl = `${baseUrl}/kos/${data.propertyId}?review=true`;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bagikan Pengalaman Tinggalmu di ${escapeHtml(data.propertyName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #059669; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .content { padding: 24px; }
    .greeting { font-size: 15px; margin-bottom: 16px; }
    .stars { font-size: 28px; color: #f59e0b; text-align: center; margin: 16px 0; letter-spacing: 4px; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KosPasti</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Gimana Pengalaman Tinggalmu?</p>
    </div>
    <div class="content">
      <p class="greeting">Halo <strong>${escapeHtml(data.studentName)}</strong>,</p>
      <p style="font-size: 13px; color: #475569;">
        Sudah 2 hari nih kamu menempati kamar di <strong>${escapeHtml(data.propertyName)}</strong>! 🎉
      </p>
      <p style="font-size: 13px; color: #475569;">
        Bagikan ulasan dan rating bintang jujurmu untuk membantu calon mahasiswa lainnya menemukan kamar kos yang nyaman dan tepat.
      </p>

      <div class="stars">⭐⭐⭐⭐⭐</div>

      <div class="btn-container">
        <a href="${reviewUrl}" class="btn" target="_blank">Tulis Ulasan &amp; Beri Rating</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">KosPasti - Platform Sewa Kos Terpercaya Indonesia</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Helper spesifik: Kirim email pengingat H-1 masuk kos
 */
export async function sendMoveInReminderEmail(
  data: MoveInReminderEmailData
): Promise<SendEmailResult> {
  const subject = `Pengingat H-1: Besok Jadwal Masuk Kos di ${data.propertyName} 🏡`;
  const html = generateMoveInReminderHtml(data);
  const text = `Halo ${data.studentName}, besok adalah jadwal masuk kos kamu di ${data.propertyName}. Siapkan dokumen KTP dan kontak pemilik kos untuk serah terima kunci.`;

  return sendEmail({
    to: data.studentEmail,
    subject,
    html,
    text,
  });
}

/**
 * Helper spesifik: Kirim email ajakan ulasan di hari ke-2
 */
export async function sendReviewPromptEmail(
  data: ReviewPromptEmailData
): Promise<SendEmailResult> {
  const subject = `Gimana Pengalamanmu di ${data.propertyName}? Bagikan Ulasanmu ⭐`;
  const html = generateReviewPromptHtml(data);
  const text = `Halo ${data.studentName}, sudah 2 hari kamu tinggal di ${data.propertyName}. Bagikan ulasan jujurmu di KosPasti!`;

  return sendEmail({
    to: data.studentEmail,
    subject,
    html,
    text,
  });
}
