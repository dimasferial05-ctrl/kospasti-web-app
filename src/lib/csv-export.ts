import { formatRupiah, VALID_REVENUE_STATUSES } from "./revenue-helper";

export interface BookingExportItem {
  id: string;
  student_name: string;
  student_whatsapp?: string;
  whatsapp_number?: string;
  move_in_date: string;
  status: string;
  created_at?: string;
  property?: {
    name: string;
  } | null;
}

export interface FinancialBookingExportItem {
  id: string;
  student_name: string;
  student_whatsapp?: string;
  whatsapp_number?: string;
  move_in_date: string;
  status: string;
  created_at?: string;
  amount: number;
  property?: {
    name: string;
    owner?: {
      name: string;
      whatsapp_number?: string;
    } | null;
  } | null;
  room_type?: {
    name: string;
    price_per_month: number;
  } | null;
}

/**
 * Mencegah CSV / Excel Formula Injection (DDE Injection)
 * Menambahkan single quote (') jika diawali dengan karakter formula
 */
export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value);

  // Mencegah DDE Formula Injection
  if (/^[=+\-@]/.test(stringValue)) {
    stringValue = "'" + stringValue;
  }

  stringValue = stringValue.replace(/"/g, '""');
  return `"${stringValue}"`;
}

/**
 * Mengonversi array riwayat booking menjadi format teks CSV standar
 */
export function formatBookingsToCSV(bookings: BookingExportItem[]): string {
  const headers = [
    "ID Transaksi",
    "Nama Mahasiswa",
    "No WhatsApp",
    "Nama Kos",
    "Tgl Masuk",
    "Status",
    "Tanggal Booking",
  ];

  const rows = bookings.map((b) => {
    const rawWhatsapp = b.student_whatsapp || b.whatsapp_number;
    const whatsapp = rawWhatsapp ? `'${rawWhatsapp}` : "-";
    const propertyName = b.property?.name || "-";
    const moveInDate = b.move_in_date
      ? new Date(b.move_in_date).toLocaleDateString("id-ID")
      : "-";
    const createdAt = b.created_at
      ? new Date(b.created_at).toLocaleDateString("id-ID")
      : "-";

    return [
      escapeCSV(b.id),
      escapeCSV(b.student_name),
      escapeCSV(whatsapp),
      escapeCSV(propertyName),
      escapeCSV(moveInDate),
      escapeCSV(b.status),
      escapeCSV(createdAt),
    ].join(";");
  });

  return [headers.join(";"), ...rows].join("\n");
}

/**
 * Mengonversi data booking dengan rincian finansial (nominal sewa, tipe kamar, ringkasan total omzet)
 */
export function formatFinancialBookingsToCSV(
  bookings: FinancialBookingExportItem[],
  options: { includeOwner?: boolean } = {}
): string {
  const headers = [
    "ID Transaksi",
    "Nama Mahasiswa",
    "No WhatsApp",
    "Nama Kos",
    "Tipe Kamar",
    ...(options.includeOwner ? ["Pemilik Kos"] : []),
    "Tgl Masuk",
    "Status",
    "Tanggal Booking",
    "Nominal Sewa (IDR)",
  ];

  let totalRevenue = 0;

  const rows = bookings.map((b) => {
    const rawWhatsapp = b.student_whatsapp || b.whatsapp_number;
    const whatsapp = rawWhatsapp ? `'${rawWhatsapp}` : "-";
    const propertyName = b.property?.name || "-";
    const roomTypeName = b.room_type?.name || "Reguler";
    const ownerName = b.property?.owner?.name || "-";
    const moveInDate = b.move_in_date
      ? new Date(b.move_in_date).toLocaleDateString("id-ID")
      : "-";
    const createdAt = b.created_at
      ? new Date(b.created_at).toLocaleDateString("id-ID")
      : "-";

    const isRevenue = VALID_REVENUE_STATUSES.includes(b.status);
    if (isRevenue) {
      totalRevenue += b.amount || 0;
    }

    const row = [
      escapeCSV(b.id),
      escapeCSV(b.student_name),
      escapeCSV(whatsapp),
      escapeCSV(propertyName),
      escapeCSV(roomTypeName),
      ...(options.includeOwner ? [escapeCSV(ownerName)] : []),
      escapeCSV(moveInDate),
      escapeCSV(b.status),
      escapeCSV(createdAt),
      escapeCSV(formatRupiah(b.amount || 0)),
    ];

    return row.join(";");
  });

  // Tambahkan baris rekapitulasi total omzet di akhir
  const emptyColsCount = headers.length - 2;
  const summaryRow = [
    escapeCSV("TOTAL PENDAPATAN SUKSES"),
    ...Array(emptyColsCount - 1).fill('""'),
    escapeCSV(formatRupiah(totalRevenue)),
  ].join(";");

  return [headers.join(";"), ...rows, summaryRow].join("\n");
}
