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
 * Mencegah CSV / Excel Formula Injection (DDE Injection)
 * Menambahkan single quote (') jika diawali dengan karakter formula (=, +, -, @)
 */
export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value).trim();

  // Mencegah DDE Formula Injection
  if (/^[=+\-@]/.test(stringValue)) {
    stringValue = "'" + stringValue;
  }

  stringValue = stringValue.replace(/"/g, '""');
  return `"${stringValue}"`;
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

/**
 * Menghasilkan teks CSV yang siap diimpor ke Excel dengan UTF-8 BOM
 */
export function generateFinancialCSV(
  items: FinancialReportItem[],
  summary: FinancialReportSummary
): string {
  const metadataRows = [
    `"REKAPITULASI LAPORAN KEUANGAN & RESERVASI MITRA - KOSPASTI"`,
    `"Periode Laporan";${escapeCSV(summary.period_label)}`,
    `"Properti Kos";${escapeCSV(summary.property_label)}`,
    `"Nama Pemilik Kos";${escapeCSV(summary.owner_name || "-")}`,
    `"Tanggal Cetak";${escapeCSV(summary.generated_at)}`,
    `""`, // Baris kosong pemisah
  ];

  const headers = [
    "No",
    "ID Booking",
    "Nama Mahasiswa",
    "No WhatsApp",
    "Nama Kos",
    "Tipe Kamar",
    "Tgl Booking",
    "Tgl Masuk",
    "Total Bayar (IDR)",
    "Potongan Admin (IDR)",
    "Pendapatan Bersih (IDR)",
    "Status Reservasi",
    "Status Pencairan",
    "Rekening Tujuan Pencairan",
  ];

  const dataRows = items.map((item, idx) => {
    const rawWa = item.student_whatsapp ? `'${item.student_whatsapp}` : "-";
    const payoutLabel =
      item.payout_status === "PAID"
        ? "SUDAH CAIR"
        : item.payout_status === "PENDING"
        ? "MENUNGGU PENCAIRAN"
        : "BELUM CAIR";

    return [
      escapeCSV(idx + 1),
      escapeCSV(item.id),
      escapeCSV(item.student_name),
      escapeCSV(rawWa),
      escapeCSV(item.property_name),
      escapeCSV(item.room_type_name),
      escapeCSV(formatDateIndo(item.created_at)),
      escapeCSV(formatDateIndo(item.move_in_date)),
      escapeCSV(formatRupiah(item.gross_amount)),
      escapeCSV(formatRupiah(item.admin_fee)),
      escapeCSV(formatRupiah(item.net_amount)),
      escapeCSV(item.booking_status),
      escapeCSV(payoutLabel),
      escapeCSV(item.payout_destination || "-"),
    ].join(";");
  });

  const emptySeparator = Array(headers.length - 2).fill('""');
  const summaryRows = [
    `""`, // Baris kosong pemisah
    [
      escapeCSV("TOTAL OMZET KOTOR"),
      ...emptySeparator,
      escapeCSV(formatRupiah(summary.total_gross_revenue)),
    ].join(";"),
    [
      escapeCSV("TOTAL POTONGAN ADMIN"),
      ...emptySeparator,
      escapeCSV(formatRupiah(summary.total_admin_fee)),
    ].join(";"),
    [
      escapeCSV("TOTAL PENDAPATAN BERSIH MITRA"),
      ...emptySeparator,
      escapeCSV(formatRupiah(summary.total_net_revenue)),
    ].join(";"),
    [
      escapeCSV("TOTAL SUDAH CAIR KE REKENING"),
      ...emptySeparator,
      escapeCSV(formatRupiah(summary.total_paid_payout)),
    ].join(";"),
    [
      escapeCSV("TOTAL MENUNGGU PENCAIRAN"),
      ...emptySeparator,
      escapeCSV(formatRupiah(summary.total_pending_payout)),
    ].join(";"),
  ];

  // Tambahkan \uFEFF (UTF-8 BOM) di awal string
  return (
    "\uFEFF" +
    [...metadataRows, headers.join(";"), ...dataRows, ...summaryRows].join("\n")
  );
}

