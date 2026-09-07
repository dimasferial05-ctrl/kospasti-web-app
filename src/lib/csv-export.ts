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

/**
 * Mengonversi array riwayat booking menjadi format teks CSV yang aman dengan escaping tanda kutip
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

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

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
