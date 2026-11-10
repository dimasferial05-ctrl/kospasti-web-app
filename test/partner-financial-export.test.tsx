import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  escapeCSV,
  formatRupiah,
  formatDateIndo,
  mapBookingToReportItem,
  filterFinancialReportItems,
  calculateFinancialSummary,
  generateFinancialCSV,
  FinancialReportItem,
} from "@/lib/financial-report-generator";
import { ExportFinancialModal } from "@/components/partner/ExportFinancialModal";
import { PrintableFinancialStatement } from "@/components/partner/PrintableFinancialStatement";

describe("Partner Financial Report & Export - Issue #384", () => {
  describe("Keamanan & Sanitasi CSV (DDE Injection)", () => {
    it("menambahkan single quote jika nilai diawali dengan formula (=, +, -, @)", () => {
      expect(escapeCSV("=1+1")).toBe("\"'=1+1\"");
      expect(escapeCSV("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");
      expect(escapeCSV("-5000")).toBe("\"'-5000\"");
      expect(escapeCSV("@SUM(A1:A10)")).toBe("\"'@SUM(A1:A10)\"");
    });

    it("mengganti tanda petik ganda dengan double quotes", () => {
      expect(escapeCSV('Kos "Graha" Asri')).toBe('"Kos ""Graha"" Asri"');
    });

    it("menangani nilai null dan undefined secara aman", () => {
      expect(escapeCSV(null)).toBe('""');
      expect(escapeCSV(undefined)).toBe('""');
    });
  });

  describe("Mapping Data Booking ke Report Item", () => {
    it("memetakan booking dengan payout yang sudah cair (PAYOUT_PAID)", () => {
      const mockBooking = {
        id: "b-01",
        student_name: "Ahmad Rizky",
        student_whatsapp: "08123456789",
        move_in_date: "2026-11-01T00:00:00.000Z",
        created_at: "2026-10-25T10:00:00.000Z",
        amount: 1200000,
        status: "COMPLETED",
        property: {
          id: "p-01",
          name: "Kos Graha Subang Asri",
          price_per_month: 1200000,
        },
        room_type: {
          id: "rt-01",
          name: "Kamar AC + KM Dalam",
          price_per_month: 1200000,
        },
        payout: {
          id: "pay-01",
          status: "PAYOUT_PAID",
          amount: 1200000,
          processed_at: "2026-11-02T14:00:00.000Z",
          payout_method_snapshot: JSON.stringify({
            bank_name: "BCA",
            account_number: "8830123456",
            account_holder: "Ibu Hj. Siti",
          }),
        },
      };

      const item = mapBookingToReportItem(mockBooking);

      expect(item.id).toBe("b-01");
      expect(item.student_name).toBe("Ahmad Rizky");
      expect(item.gross_amount).toBe(1200000);
      expect(item.net_amount).toBe(1200000);
      expect(item.admin_fee).toBe(0);
      expect(item.payout_status).toBe("PAID");
      expect(item.payout_destination).toContain("BCA - 8830123456");
      expect(item.payout_destination).toContain("Ibu Hj. Siti");
    });

    it("memetakan booking yang baru selesai dan masih menunggu payout", () => {
      const mockBooking = {
        id: "b-02",
        student_name: "Siti Rahma",
        student_whatsapp: "08198765432",
        move_in_date: "2026-11-10T00:00:00.000Z",
        created_at: "2026-11-05T08:00:00.000Z",
        amount: 850000,
        status: "PAYOUT_PENDING",
        property: {
          id: "p-02",
          name: "Kos Melati",
          price_per_month: 850000,
        },
        room_type: null,
        payout: null,
      };

      const item = mapBookingToReportItem(mockBooking);

      expect(item.id).toBe("b-02");
      expect(item.gross_amount).toBe(850000);
      expect(item.payout_status).toBe("PENDING");
    });
  });

  describe("Filter Periode & Properti", () => {
    const fixedNow = new Date(2026, 10, 15); // 15 November 2026 (Month 10 is November in 0-indexed)

    const mockItems: FinancialReportItem[] = [
      {
        id: "1",
        student_name: "Nov 2026",
        student_whatsapp: "081",
        property_name: "Kos A",
        property_id: "p-a",
        room_type_name: "Standar",
        move_in_date: "2026-11-10",
        created_at: "2026-11-05T10:00:00.000Z",
        gross_amount: 1000000,
        admin_fee: 0,
        net_amount: 1000000,
        booking_status: "COMPLETED",
        payout_status: "PAID",
      },
      {
        id: "2",
        student_name: "Oct 2026",
        student_whatsapp: "082",
        property_name: "Kos B",
        property_id: "p-b",
        room_type_name: "Standar",
        move_in_date: "2026-10-15",
        created_at: "2026-10-12T10:00:00.000Z",
        gross_amount: 900000,
        admin_fee: 0,
        net_amount: 900000,
        booking_status: "COMPLETED",
        payout_status: "PAID",
      },
      {
        id: "3",
        student_name: "Sep 2026",
        student_whatsapp: "083",
        property_name: "Kos A",
        property_id: "p-a",
        room_type_name: "Standar",
        move_in_date: "2026-09-01",
        created_at: "2026-08-28T10:00:00.000Z",
        gross_amount: 1000000,
        admin_fee: 0,
        net_amount: 1000000,
        booking_status: "COMPLETED",
        payout_status: "PAID",
      },
      {
        id: "4",
        student_name: "Nov 2025",
        student_whatsapp: "084",
        property_name: "Kos A",
        property_id: "p-a",
        room_type_name: "Standar",
        move_in_date: "2025-11-01",
        created_at: "2025-11-01T10:00:00.000Z",
        gross_amount: 800000,
        admin_fee: 0,
        net_amount: 800000,
        booking_status: "COMPLETED",
        payout_status: "PAID",
      },
    ];

    it("memfilter data dengan periode THIS_MONTH", () => {
      const res = filterFinancialReportItems(mockItems, "THIS_MONTH", "ALL", fixedNow);
      expect(res.length).toBe(1);
      expect(res[0].id).toBe("1");
    });

    it("memfilter data dengan periode LAST_MONTH", () => {
      const res = filterFinancialReportItems(mockItems, "LAST_MONTH", "ALL", fixedNow);
      expect(res.length).toBe(1);
      expect(res[0].id).toBe("2");
    });

    it("memfilter data dengan periode THIS_YEAR", () => {
      const res = filterFinancialReportItems(mockItems, "THIS_YEAR", "ALL", fixedNow);
      expect(res.length).toBe(3);
    });

    it("memfilter data berdasarkan propertyId spesifik", () => {
      const res = filterFinancialReportItems(mockItems, "ALL", "p-b", fixedNow);
      expect(res.length).toBe(1);
      expect(res[0].property_name).toBe("Kos B");
    });
  });

  describe("Kalkulasi Rekapitulasi Summary & Output CSV", () => {
    it("menghitung ringkasan pendapatan dan status payout secara akurat", () => {
      const items: FinancialReportItem[] = [
        {
          id: "1",
          student_name: "Penyewa 1",
          student_whatsapp: "081",
          property_name: "Kos A",
          room_type_name: "Standar",
          move_in_date: "2026-11-01",
          created_at: "2026-11-01",
          gross_amount: 1000000,
          admin_fee: 0,
          net_amount: 1000000,
          booking_status: "COMPLETED",
          payout_status: "PAID",
        },
        {
          id: "2",
          student_name: "Penyewa 2",
          student_whatsapp: "082",
          property_name: "Kos A",
          room_type_name: "Standar",
          move_in_date: "2026-11-05",
          created_at: "2026-11-05",
          gross_amount: 1500000,
          admin_fee: 0,
          net_amount: 1500000,
          booking_status: "COMPLETED",
          payout_status: "PENDING",
        },
        {
          id: "3",
          student_name: "Penyewa Batal",
          student_whatsapp: "083",
          property_name: "Kos A",
          room_type_name: "Standar",
          move_in_date: "2026-11-06",
          created_at: "2026-11-06",
          gross_amount: 1000000,
          admin_fee: 0,
          net_amount: 1000000,
          booking_status: "CANCELLED",
          payout_status: "NONE",
        },
      ];

      const summary = calculateFinancialSummary(
        items,
        "Bulan Ini",
        "Semua Kos",
        "Pak Budi",
        "08123456"
      );

      // Transaksi batal tidak dihitung ke omzet
      expect(summary.total_transactions).toBe(3);
      expect(summary.total_gross_revenue).toBe(2500000);
      expect(summary.total_net_revenue).toBe(2500000);
      expect(summary.total_paid_payout).toBe(1000000);
      expect(summary.total_pending_payout).toBe(1500000);
    });

    it("menghasilkan teks CSV yang memuat BOM UTF-8, metadata, dan data transaksi", () => {
      const items: FinancialReportItem[] = [
        {
          id: "bk-101",
          student_name: "Dimas Ferial",
          student_whatsapp: "081234567890",
          property_name: "Kos Graha Subang Asri",
          room_type_name: "Kamar AC",
          move_in_date: "2026-11-01",
          created_at: "2026-10-25",
          gross_amount: 1200000,
          admin_fee: 0,
          net_amount: 1200000,
          booking_status: "COMPLETED",
          payout_status: "PAID",
          payout_destination: "BCA - 1234567890",
        },
      ];

      const summary = calculateFinancialSummary(items, "Bulan Ini", "Semua Kos");
      const csv = generateFinancialCSV(items, summary);

      // Pastikan ada UTF-8 BOM
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Pastikan memuat header penting
      expect(csv).toContain("REKAPITULASI LAPORAN KEUANGAN & RESERVASI MITRA");
      expect(csv).toContain("Periode Laporan");
      expect(csv).toContain("Dimas Ferial");
      expect(csv).toContain("Kos Graha Subang Asri");
      expect(csv).toContain("SUDAH CAIR");
      expect(csv).toContain("TOTAL OMZET KOTOR");
    });
  });

  describe("UI Components: ExportFinancialModal & PrintableFinancialStatement", () => {
    it("merender ExportFinancialModal tanpa crash", () => {
      const html = renderToStaticMarkup(
        <ExportFinancialModal
          isOpen={true}
          onClose={vi.fn()}
          bookings={[
            {
              id: "b-01",
              student_name: "Budi Santoso",
              student_whatsapp: "081234567",
              move_in_date: "2026-11-01",
              created_at: "2026-11-01",
              amount: 1000000,
              status: "COMPLETED",
              property: { id: "p1", name: "Kos Mawar" },
            },
          ]}
        />
      );

      expect(html).toContain("Unduh Laporan Keuangan");
      expect(html).toContain("Unduh Excel / CSV (.csv)");
      expect(html).toContain("Cetak / Simpan PDF");
      expect(html).toContain("Bulan Ini");
    });

    it("merender PrintableFinancialStatement tanpa crash", () => {
      const summary = calculateFinancialSummary([], "Bulan Ini", "Semua Kos");
      const html = renderToStaticMarkup(
        <PrintableFinancialStatement
          items={[]}
          summary={summary}
          onClose={vi.fn()}
        />
      );

      expect(html).toContain("Pratinjau Laporan Keuangan");
      expect(html).toContain("Laporan Rekapitulasi Pendapatan &amp; Reservasi");
      expect(html).toContain("Total Omzet Kotor");
      expect(html).toContain("Sudah Cair ke Rekening");
    });
  });
});

