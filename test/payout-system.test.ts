import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyCheckinConfirmed, notifyPayoutProcessed } from "@/lib/notifications";
import { getBookingAmount, VALID_REVENUE_STATUSES } from "@/lib/revenue-helper";

// Mock whatsapp module
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true, simulated: true }),
}));

describe("Payout System - Notification Helpers", () => {
  it("notifyCheckinConfirmed prints log and triggers notification without error", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyCheckinConfirmed({
      tenantName: "Budi Santoso",
      tenantWhatsapp: "081234567890",
      propertyName: "Kos Pasti Nyaman",
      checkinTime: new Date("2026-10-15T10:00:00Z"),
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("notifyPayoutProcessed prints log and triggers payout notification without error", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyPayoutProcessed({
      ownerName: "Pak Haji",
      ownerWhatsapp: "081987654321",
      amount: 1500000,
      bankName: "BCA",
      accountNumber: "1234567890",
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("Payout System - Revenue & Booking Amount Calculation", () => {
  it("prioritizes booking.amount when set and > 0", () => {
    const record = {
      id: "b-payout-1",
      created_at: new Date(),
      status: "COMPLETED",
      amount: 2500000,
      property: { name: "Kos Test", price_per_month: 2000000 },
      room_type: { name: "Deluxe", price_per_month: 2300000 },
    };

    expect(getBookingAmount(record)).toBe(2500000);
  });

  it("falls back to room_type and property when booking.amount is not provided or 0", () => {
    const record = {
      id: "b-payout-2",
      created_at: new Date(),
      status: "PAYOUT_PENDING",
      amount: 0,
      property: { name: "Kos Test", price_per_month: 1200000 },
      room_type: { name: "Standar", price_per_month: 1400000 },
    };

    expect(getBookingAmount(record)).toBe(1400000);
  });

  it("includes COMPLETED, PAYOUT_PENDING, and PAYOUT_PAID in VALID_REVENUE_STATUSES", () => {
    expect(VALID_REVENUE_STATUSES).toContain("COMPLETED");
    expect(VALID_REVENUE_STATUSES).toContain("PAYOUT_PENDING");
    expect(VALID_REVENUE_STATUSES).toContain("PAYOUT_PAID");
  });
});
