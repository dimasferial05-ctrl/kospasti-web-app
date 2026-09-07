import { describe, it, expect } from "vitest";
import { formatBookingsToCSV, BookingExportItem } from "../src/lib/csv-export";

describe("CSV Export Helper (src/lib/csv-export.ts)", () => {
  it("menghasilkan header CSV yang benar", () => {
    const csv = formatBookingsToCSV([]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "ID Transaksi,Nama Mahasiswa,No WhatsApp,Nama Kos,Tgl Masuk,Status,Tanggal Booking"
    );
  });

  it("memformat data booking ke baris CSV dengan escaping yang benar", () => {
    const mockBookings: BookingExportItem[] = [
      {
        id: "book-123",
        student_name: 'Budi "Santoso", S.Kom',
        student_whatsapp: "081234567890",
        move_in_date: "2026-09-01T00:00:00.000Z",
        status: "SUCCESS",
        created_at: "2026-08-25T10:00:00.000Z",
        property: {
          name: "Kos Melati, Indah",
        },
      },
    ];

    const csv = formatBookingsToCSV(mockBookings);
    const lines = csv.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"book-123"');
    expect(lines[1]).toContain('"Budi ""Santoso"", S.Kom"');
    expect(lines[1]).toContain('"081234567890"');
    expect(lines[1]).toContain('"Kos Melati, Indah"');
    expect(lines[1]).toContain('"SUCCESS"');
  });

  it("menangani properti bernilai undefined atau null dengan fallback tanda strip (-)", () => {
    const mockBookings: BookingExportItem[] = [
      {
        id: "book-456",
        student_name: "Siti Rahma",
        student_whatsapp: undefined,
        whatsapp_number: undefined,
        move_in_date: "",
        status: "PENDING",
        created_at: undefined,
        property: null,
      },
    ];

    const csv = formatBookingsToCSV(mockBookings);
    const lines = csv.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"book-456"');
    expect(lines[1]).toContain('"Siti Rahma"');
    expect(lines[1]).toContain('"-"');
  });
});
