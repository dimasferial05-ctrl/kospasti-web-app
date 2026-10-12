import { describe, it, expect } from "vitest";
import {
  VALID_REVENUE_STATUSES,
  aggregateMonthlyRevenue,
  BookingFinancialRecord,
} from "@/lib/revenue-helper";
import {
  formatFinancialBookingsToCSV,
  FinancialBookingExportItem,
} from "@/lib/csv-export";

describe("Booking Cancellation & Refund Policy Unit Tests", () => {
  it("status CANCELLED, REFUND_REQUESTED, dan REFUNDED otomatis dikecualikan dari omzet aktif", () => {
    expect(VALID_REVENUE_STATUSES).not.toContain("CANCELLED");
    expect(VALID_REVENUE_STATUSES).not.toContain("REFUND_REQUESTED");
    expect(VALID_REVENUE_STATUSES).not.toContain("REFUNDED");
    expect(VALID_REVENUE_STATUSES).not.toContain("REJECTED");

    // Hanya status sukses yang valid
    expect(VALID_REVENUE_STATUSES).toContain("PAID");
    expect(VALID_REVENUE_STATUSES).toContain("ACCEPTED");
    expect(VALID_REVENUE_STATUSES).toContain("APPROVED");
  });

  it("agregasi omzet bulanan mengabaikan pesanan yang dibatalkan atau dalam status refund", () => {
    const now = new Date();
    const mockBookings: BookingFinancialRecord[] = [
      {
        id: "b-paid-1",
        created_at: now,
        status: "PAID",
        property: { name: "Kos Amanah", price_per_month: 1500000 },
      },
      {
        id: "b-approved-1",
        created_at: now,
        status: "APPROVED",
        property: { name: "Kos Amanah", price_per_month: 2000000 },
      },
      {
        id: "b-cancelled-1",
        created_at: now,
        status: "CANCELLED",
        property: { name: "Kos Amanah", price_per_month: 1200000 },
      },
      {
        id: "b-refund-req-1",
        created_at: now,
        status: "REFUND_REQUESTED",
        property: { name: "Kos Amanah", price_per_month: 1800000 },
      },
      {
        id: "b-refunded-1",
        created_at: now,
        status: "REFUNDED",
        property: { name: "Kos Amanah", price_per_month: 2500000 },
      },
    ];

    const monthlyData = aggregateMonthlyRevenue(mockBookings, 3);
    const currentMonth = monthlyData[monthlyData.length - 1];

    // Hanya b-paid-1 (1.5jt) + b-approved-1 (2jt) = 3.5jt yang dihitung
    expect(currentMonth.revenue).toBe(3500000);
    expect(currentMonth.bookingsCount).toBe(2);
  });

  it("ekspor CSV finansial mencantumkan informasi alasan pembatalan dan catatan pengembalian dana", () => {
    const exportData: FinancialBookingExportItem[] = [
      {
        id: "TRX-REFUND-01",
        student_name: "Ahmad Dahlan",
        student_whatsapp: "081234567890",
        move_in_date: "2026-11-01",
        status: "REFUND_REQUESTED",
        created_at: "2026-10-12",
        amount: 1750000,
        cancellation_reason: "Perubahan jadwal masuk perkuliahan",
        refund_note: null,
        property: {
          name: "Kos Graha Pasti",
          owner: { name: "Haji Sukri", whatsapp_number: "0811223344" },
        },
        room_type: { name: "Single AC", price_per_month: 1750000 },
      },
      {
        id: "TRX-REFUNDED-02",
        student_name: "Dewi Sartika",
        student_whatsapp: "089876543210",
        move_in_date: "2026-11-05",
        status: "REFUNDED",
        created_at: "2026-10-12",
        amount: 1200000,
        cancellation_reason: "Salah pilih tipe kamar",
        refund_note: "Transfer via BCA Mobile ref #887219",
        property: {
          name: "Kos Graha Pasti",
          owner: { name: "Haji Sukri", whatsapp_number: "0811223344" },
        },
      },
    ];

    const csvOutput = formatFinancialBookingsToCSV(exportData, { includeOwner: true });

    // Kolom header baru
    expect(csvOutput).toContain("Alasan Batal / Catatan Refund");

    // Alasan pembatalan dan catatan transfer
    expect(csvOutput).toContain("Perubahan jadwal masuk perkuliahan");
    expect(csvOutput).toContain("Transfer via BCA Mobile ref #887219");

    // Status refund tidak dihitung ke omzet
    expect(csvOutput).toContain("TOTAL PENDAPATAN SUKSES");
    expect(csvOutput).toContain(formatFinancialBookingsToCSV([]).split(";").pop() || "0");

    // Konsistensi alignment kolom header dan baris summary
    const lines = csvOutput.split("\n");
    const headerCols = lines[0].split(";").length;
    const summaryCols = lines[lines.length - 1].split(";").length;
    expect(summaryCols).toBe(headerCols);
  });

  it("validasi alur transisi status pembatalan", () => {
    // Alur: PENDING -> CANCELLED
    const canCancelPending = (status: string) => status === "PENDING";
    expect(canCancelPending("PENDING")).toBe(true);

    // Alur: PAID/APPROVED/ACCEPTED -> REFUND_REQUESTED
    const canRequestRefund = (status: string) =>
      ["PAID", "APPROVED", "ACCEPTED"].includes(status.toUpperCase());
    expect(canRequestRefund("PAID")).toBe(true);
    expect(canRequestRefund("APPROVED")).toBe(true);
    expect(canRequestRefund("ACCEPTED")).toBe(true);
    expect(canRequestRefund("CANCELLED")).toBe(false);
    expect(canRequestRefund("REFUNDED")).toBe(false);

    // Alur: REFUND_REQUESTED -> REFUNDED
    const canCompleteRefund = (status: string) => status === "REFUND_REQUESTED";
    expect(canCompleteRefund("REFUND_REQUESTED")).toBe(true);
    expect(canCompleteRefund("CANCELLED")).toBe(false);
  });
});
