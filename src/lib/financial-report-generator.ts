/**
 * Helper & Generator Laporan Keuangan & Reservasi Mitra KosPasti
 * Menyediakan formatting CSV (Excel-ready dengan UTF-8 BOM & DDE formula protection)
 * serta kalkulasi agregasi finansial untuk ekspor laporan mitra.
 */

export interface FinancialReportItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  property_name: string;
  property_id?: string;
  room_type_name: string;
  move_in_date: string;
  created_at: string;
  gross_amount: number;
  admin_fee: number;
  net_amount: number;
  booking_status: string;
  payout_status: "PAID" | "PENDING" | "NONE";
  payout_processed_at?: string | null;
  payout_destination?: string | null;
}

export type ReportPeriodFilter =
  | "ALL"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "LAST_3_MONTHS"
  | "THIS_YEAR";

export interface FinancialReportSummary {
  period_label: string;
  property_label: string;
  total_transactions: number;
  total_gross_revenue: number;
  total_admin_fee: number;
  total_net_revenue: number;
  total_paid_payout: number;
  total_pending_payout: number;
  generated_at: string;
  owner_name?: string;
  owner_whatsapp?: string;
}

export const PERIOD_LABELS: Record<ReportPeriodFilter, string> = {
  THIS_MONTH: "Bulan Ini",
  LAST_MONTH: "Bulan Lalu",
  LAST_3_MONTHS: "3 Bulan Terakhir",
  THIS_YEAR: "Tahun Ini",
  ALL: "Semua Riwayat Transaksi",
};

/**
 * Format mata uang Rupiah standar Indonesia
 */
export function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format tanggal Indonesia ramah pembaca
 */
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format nomor WhatsApp menjadi format teks rapi dengan tanda hubung
 * Mencegah Excel mengubahnya menjadi notasi ilmiah (8.13E+11) dan menghilangkan tanda petik (') yang merusak tampilan
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("08") && cleaned.length >= 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith("628") && cleaned.length >= 11) {
    return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

/**
 * Mencegah CSV / Excel Formula Injection (DDE Injection)
 * Menambahkan single quote (') hanya jika diawali dengan karakter formula (=, +, -, @)
 * Membungkus dengan tanda petik ganda hanya jika mengandung delimiter, tanda petik, atau newline
 */
export function escapeCSV(
  value: string | number | null | undefined,
  delimiter: string = ","
): string {
  if (value === null || value === undefined) return "";
  let stringValue = String(value).trim();
  if (stringValue === "") return "";

  // Mencegah DDE Formula Injection
  if (/^[=+\-@]/.test(stringValue)) {
    stringValue = "'" + stringValue;
  }

  if (
    stringValue.includes(delimiter) ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    stringValue = `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Mapping data booking dari API menjadi FinancialReportItem yang terstandarisasi
 */
export function mapBookingToReportItem(b: any): FinancialReportItem {
  const grossAmount =
    b.amount > 0
      ? b.amount
      : b.room_type?.price_per_month ?? b.property?.price_per_month ?? 0;

  // Platform admin fee (saat ini platform tidak memotong sewa mitra)
  const adminFee = 0;
  const netAmount = Math.max(0, grossAmount - adminFee);

  // Status Payout
  let payoutStatus: "PAID" | "PENDING" | "NONE" = "NONE";
  let payoutProcessedAt: string | null = null;
  let payoutDestination: string | null = null;

  if (b.payout) {
    if (b.payout.status === "PAYOUT_PAID") {
      payoutStatus = "PAID";
      payoutProcessedAt = b.payout.processed_at;
    } else {
      payoutStatus = "PENDING";
    }

    if (b.payout.payout_method_snapshot) {
      try {
        const snap =
          typeof b.payout.payout_method_snapshot === "string"
            ? JSON.parse(b.payout.payout_method_snapshot)
            : b.payout.payout_method_snapshot;
        if (snap.bank_name && snap.account_number) {
          payoutDestination = `${snap.bank_name} - ${snap.account_number} (a.n. ${snap.account_holder || "-"})`;
        }
      } catch {
        payoutDestination = String(b.payout.payout_method_snapshot);
      }
    }
  } else if (
    b.status === "COMPLETED" ||
    b.status === "PAYOUT_PENDING" ||
    b.status === "APPROVED" ||
    b.status === "ACCEPTED"
  ) {
    payoutStatus = "PENDING";
  }

  return {
    id: b.id,
    student_name: b.student_name || "Tanpa Nama",
    student_whatsapp: b.student_whatsapp || b.user?.whatsapp || "-",
    property_name: b.property?.name || "Kos Tanpa Nama",
    property_id: b.property?.id,
    room_type_name: b.room_type?.name || "Kamar Standar",
    move_in_date: b.move_in_date,
    created_at: b.created_at,
    gross_amount: grossAmount,
    admin_fee: adminFee,
    net_amount: netAmount,
    booking_status: b.status,
    payout_status: payoutStatus,
    payout_processed_at: payoutProcessedAt,
    payout_destination: payoutDestination || "Rekening Terdaftar Mitra",
  };
}

/**
 * Filter data berdasarkan periode kalender & properti
 */
export function filterFinancialReportItems(
  items: FinancialReportItem[],
  period: ReportPeriodFilter,
  propertyId?: string,
  referenceDate: Date = new Date()
): FinancialReportItem[] {
  return items.filter((item) => {
    // 1. Filter Properti
    if (propertyId && propertyId !== "ALL" && item.property_id) {
      if (item.property_id !== propertyId) return false;
    }

    if (period === "ALL") return true;

    const itemDate = new Date(item.created_at || item.move_in_date);
    if (isNaN(itemDate.getTime())) return true;

    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth(); // 0-indexed

    switch (period) {
      case "THIS_MONTH":
        return (
          itemDate.getFullYear() === refYear && itemDate.getMonth() === refMonth
        );

      case "LAST_MONTH": {
        const lastMonthDate = new Date(refYear, refMonth - 1, 1);
        return (
          itemDate.getFullYear() === lastMonthDate.getFullYear() &&
          itemDate.getMonth() === lastMonthDate.getMonth()
        );
      }

      case "LAST_3_MONTHS": {
        const threeMonthsAgo = new Date(refYear, refMonth - 2, 1);
        const endOfThisMonth = new Date(refYear, refMonth + 1, 0, 23, 59, 59);
        return itemDate >= threeMonthsAgo && itemDate <= endOfThisMonth;
      }

      case "THIS_YEAR":
        return itemDate.getFullYear() === refYear;

      default:
        return true;
    }
  });
}

/**
 * Menghitung rekapitulasi angka finansial
 */
export function calculateFinancialSummary(
  items: FinancialReportItem[],
  periodLabel: string,
  propertyLabel: string,
  ownerName?: string,
  ownerWhatsapp?: string
): FinancialReportSummary {
  let totalGross = 0;
  let totalAdmin = 0;
  let totalNet = 0;
  let totalPaid = 0;
  let totalPending = 0;

  for (const item of items) {
    // Transaksi yang dibatalkan/ditolak tidak dihitung ke omzet
    const isCancelled = ["REJECTED", "CANCELLED", "REFUNDED"].includes(
      item.booking_status
    );
    if (!isCancelled) {
      totalGross += item.gross_amount;
      totalAdmin += item.admin_fee;
      totalNet += item.net_amount;

      if (item.payout_status === "PAID") {
        totalPaid += item.net_amount;
      } else if (item.payout_status === "PENDING") {
        totalPending += item.net_amount;
      }
    }
  }

  return {
    period_label: periodLabel,
    property_label: propertyLabel,
    total_transactions: items.length,
    total_gross_revenue: totalGross,
    total_admin_fee: totalAdmin,
    total_net_revenue: totalNet,
    total_paid_payout: totalPaid,
    total_pending_payout: totalPending,
    generated_at: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    owner_name: ownerName,
    owner_whatsapp: ownerWhatsapp,
  };
}

export interface FinancialCSVOptions {
  delimiter?: "," | ";";
  includeSepHeader?: boolean;
}

/**
 * Menghasilkan teks CSV yang siap diimpor ke Excel dengan UTF-8 BOM,
 * directive sep= untuk kompatibilitas otomatis locale Windows Excel,
 * serta pemformatan angka dan nomor telepon yang rapi tanpa tanda petik yang mengganggu.
 */
export function generateFinancialCSV(
  items: FinancialReportItem[],
  summary: FinancialReportSummary,
  options: FinancialCSVOptions = {}
): string {
  const delimiter = options.delimiter || ",";
  const includeSepHeader = options.includeSepHeader !== false;

  const lines: string[] = [];

  // Directive sep= untuk memberi tahu Excel pembatas kolom yang digunakan
  if (includeSepHeader) {
    lines.push(`sep=${delimiter}`);
  }

  // Baris Header Kolom Tabel Utama
  const headers = [
    "No",
    "ID Booking",
    "Nama Mahasiswa",
    "No WhatsApp",
    "Nama Kos",
    "Tipe Kamar",
    "Tgl Booking",
    "Tgl Masuk",
    "Total Bayar (Rp)",
    "Potongan Admin (Rp)",
    "Pendapatan Bersih (Rp)",
    "Status Reservasi",
    "Status Pencairan",
    "Rekening Tujuan Pencairan",
  ];
  lines.push(headers.map((h) => escapeCSV(h, delimiter)).join(delimiter));

  // Baris Data Transaksi
  items.forEach((item, idx) => {
    const formattedWa = formatPhoneNumber(item.student_whatsapp);
    const payoutLabel =
      item.payout_status === "PAID"
        ? "SUDAH CAIR"
        : item.payout_status === "PENDING"
        ? "MENUNGGU PENCAIRAN"
        : "BELUM CAIR";

    const row = [
      escapeCSV(idx + 1, delimiter),
      escapeCSV(item.id, delimiter),
      escapeCSV(item.student_name, delimiter),
      escapeCSV(formattedWa, delimiter),
      escapeCSV(item.property_name, delimiter),
      escapeCSV(item.room_type_name, delimiter),
      escapeCSV(formatDateIndo(item.created_at), delimiter),
      escapeCSV(formatDateIndo(item.move_in_date), delimiter),
      // Angka numerik murni agar Excel dapat melakukan kalkulasi/sum langsung
      String(Math.max(0, Math.round(item.gross_amount))),
      String(Math.max(0, Math.round(item.admin_fee))),
      String(Math.max(0, Math.round(item.net_amount))),
      escapeCSV(item.booking_status, delimiter),
      escapeCSV(payoutLabel, delimiter),
      escapeCSV(item.payout_destination || "-", delimiter),
    ];
    lines.push(row.join(delimiter));
  });

  // Baris Ringkasan Finansial (Summary Rows)
  // Kolom 1..8: Label & sel kosong (7 sel)
  // Kolom 9: Total Bayar
  // Kolom 10: Total Admin
  // Kolom 11: Total Pendapatan Bersih
  // Kolom 12..14: sel kosong (3 sel)
  lines.push(""); // Baris kosong pemisah

  const emptyCols1to8 = Array(7).fill("");
  const emptyCols12to14 = Array(3).fill("");

  // Total Keseluruhan
  const totalRow = [
    escapeCSV("TOTAL OMZET & PENDAPATAN", delimiter),
    ...emptyCols1to8,
    String(summary.total_gross_revenue),
    String(summary.total_admin_fee),
    String(summary.total_net_revenue),
    ...emptyCols12to14,
  ];
  lines.push(totalRow.join(delimiter));

  // Total Sudah Cair
  const paidRow = [
    escapeCSV("TOTAL SUDAH DICAIRKAN", delimiter),
    ...emptyCols1to8,
    "",
    "",
    String(summary.total_paid_payout),
    ...emptyCols12to14,
  ];
  lines.push(paidRow.join(delimiter));

  // Total Menunggu Pencairan
  const pendingRow = [
    escapeCSV("TOTAL MENUNGGU PENCAIRAN", delimiter),
    ...emptyCols1to8,
    "",
    "",
    String(summary.total_pending_payout),
    ...emptyCols12to14,
  ];
  lines.push(pendingRow.join(delimiter));

  // Bagian Informasi Laporan & Catatan di bawah tabel
  lines.push("");
  lines.push(escapeCSV("INFORMASI REKAPITULASI LAPORAN", delimiter));
  lines.push(
    [
      escapeCSV("Judul Laporan", delimiter),
      escapeCSV("Rekapitulasi Keuangan & Reservasi Mitra - KosPasti", delimiter),
    ].join(delimiter)
  );
  lines.push(
    [
      escapeCSV("Periode Laporan", delimiter),
      escapeCSV(summary.period_label, delimiter),
    ].join(delimiter)
  );
  lines.push(
    [
      escapeCSV("Properti Kos", delimiter),
      escapeCSV(summary.property_label, delimiter),
    ].join(delimiter)
  );
  lines.push(
    [
      escapeCSV("Nama Pemilik Kos", delimiter),
      escapeCSV(summary.owner_name || "-", delimiter),
    ].join(delimiter)
  );
  lines.push(
    [
      escapeCSV("Tanggal Unduh", delimiter),
      escapeCSV(summary.generated_at, delimiter),
    ].join(delimiter)
  );
  lines.push(
    [
      escapeCSV("Total Transaksi", delimiter),
      escapeCSV(`${summary.total_transactions} Transaksi`, delimiter),
    ].join(delimiter)
  );

  // Return dengan UTF-8 BOM (\uFEFF) dan newline CRLF (\r\n) agar kompatibel sempurna dengan Excel
  return "\uFEFF" + lines.join("\r\n");
}

