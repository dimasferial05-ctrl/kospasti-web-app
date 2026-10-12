import { describe, it, expect } from "vitest";
import {
  getBookingAmount,
  formatRupiah,
  calculateRevenueGrowth,
  aggregateMonthlyRevenue,
  VALID_REVENUE_STATUSES,
} from "@/lib/revenue-helper";
import {
  escapeCSV,
  formatFinancialBookingsToCSV,
  FinancialBookingExportItem,
} from "@/lib/csv-export";

describe("Revenue Helper Unit Tests", () => {
  it("mengutamakan harga room_type di atas harga property", () => {
    const booking = {
      id: "b-1",
      created_at: new Date(),
      status: "PAID",
      property: { name: "Kos Mawar", price_per_month: 1000000 },
      room_type: { name: "VIP", price_per_month: 1750000 },
    };
    expect(getBookingAmount(booking)).toBe(1750000);
  });

  it("fallback ke harga property jika room_type tidak ada", () => {
    const booking = {
      id: "b-2",
      created_at: new Date(),
      status: "ACCEPTED",
      property: { name: "Kos Melati", price_per_month: 850000 },
    };
    expect(getBookingAmount(booking)).toBe(850000);
  });

  it("mengembalikan 0 jika property dan room_type bernilai null", () => {
    const booking = {
      id: "b-3",
      created_at: new Date(),
      status: "PAID",
    };
    expect(getBookingAmount(booking)).toBe(0);
  });

  it("memformat angka ke format Rupiah standar Indonesia", () => {
    const formatted = formatRupiah(1500000);
    expect(formatted).toContain("1.500.000");
  });

  it("menghitung persentase pertumbuhan omzet bulanan dengan benar", () => {
    // Kenaikan dari 1jt ke 1.5jt = 50%
    expect(calculateRevenueGrowth(1500000, 1000000)).toBe(50);
    // Penurunan dari 1jt ke 800rb = -20%
    expect(calculateRevenueGrowth(800000, 1000000)).toBe(-20);
    // Bulan lalu 0, bulan ini 500rb = 100%
    expect(calculateRevenueGrowth(500000, 0)).toBe(100);
    // Dua-duanya 0 = 0%
    expect(calculateRevenueGrowth(0, 0)).toBe(0);
  });

  it("mengelompokkan agregasi omzet bulanan hanya untuk status sukses", () => {
    const now = new Date();
    const bookings = [
      {
        id: "b-10",
        created_at: now,
        status: "PAID",
        property: { name: "Kos A", price_per_month: 1000000 },
      },
      {
        id: "b-11",
        created_at: now,
        status: "ACCEPTED",
        property: { name: "Kos A", price_per_month: 1200000 },
      },
      {
        id: "b-12",
        created_at: now,
        status: "REJECTED", // Tidak boleh dihitung
        property: { name: "Kos A", price_per_month: 5000000 },
      },
    ];

    const monthlyTrend = aggregateMonthlyRevenue(bookings, 6);
    expect(monthlyTrend).toHaveLength(6);

    // Bulan terakhir (bulan sekarang) harus punya 2 booking dengan total 2.2jt
    const currentMonthData = monthlyTrend[monthlyTrend.length - 1];
    expect(currentMonthData.revenue).toBe(2200000);
    expect(currentMonthData.bookingsCount).toBe(2);
  });
});

describe("CSV Export Security & Financial Formatting Tests", () => {
  it("mencegah Excel / CSV Formula Injection (DDE Injection)", () => {
    expect(escapeCSV("=CMD|' /C calc'!A0")).toBe(`"'=CMD|' /C calc'!A0"`);
    expect(escapeCSV("+123456")).toBe(`"'+123456"`);
    expect(escapeCSV("-500")).toBe(`"'-500"`);
    expect(escapeCSV("@SUM(A1:A10)")).toBe(`"'@SUM(A1:A10)"`);
    expect(escapeCSV('Teks "Biasa"')).toBe(`"Teks ""Biasa"""`);
  });

  it("menghasilkan CSV finansial lengkap dengan baris ringkasan total omzet", () => {
    const sampleData: FinancialBookingExportItem[] = [
      {
        id: "TRX-101",
        student_name: "Budi Santoso",
        student_whatsapp: "081234567890",
        move_in_date: "2026-10-15",
        status: "PAID",
        created_at: "2026-10-12",
        amount: 1500000,
        property: {
          name: "Kos Graha Pasti",
          owner: { name: "Pak Slamet", whatsapp_number: "0811111111" },
        },
        room_type: { name: "Deluxe AC", price_per_month: 1500000 },
      },
      {
        id: "TRX-102",
        student_name: "Siti Rahma",
        student_whatsapp: "089876543210",
        move_in_date: "2026-10-20",
        status: "REJECTED", // Tidak menambah total sukses
        created_at: "2026-10-12",
        amount: 1000000,
        property: {
          name: "Kos Graha Pasti",
        },
      },
    ];

    const csvOutput = formatFinancialBookingsToCSV(sampleData, { includeOwner: true });
    expect(csvOutput).toContain("Pemilik Kos");
    expect(csvOutput).toContain("Deluxe AC");
    expect(csvOutput).toContain("TOTAL PENDAPATAN SUKSES");
    expect(csvOutput).toContain("1.500.000"); // Dari TRX-101 yang PAID

    // Verifikasi penyesuaian jumlah kolom (alignment) dengan baris header
    const lines = csvOutput.split("\n");
    const headerCols = lines[0].split(";").length;
    const summaryCols = lines[lines.length - 1].split(";").length;
    expect(summaryCols).toBe(headerCols);

    // Verifikasi tanpa includeOwner juga presisi
    const csvPartnerOutput = formatFinancialBookingsToCSV(sampleData);
    const partnerLines = csvPartnerOutput.split("\n");
    expect(partnerLines[partnerLines.length - 1].split(";").length).toBe(
      partnerLines[0].split(";").length
    );
  });
});
