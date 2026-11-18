import { describe, it, expect } from "vitest";
import {
  ALLOWED_STATUSES,
  RESERVED_BOOKING_STATUSES,
  PAID_CONFIRMED_STATUSES,
  ACTIVE_BOOKING_STATUSES,
} from "@/lib/booking-statuses";

describe("Booking Status Definitions (Issue #420)", () => {
  it("ALLOWED_STATUSES mendefinisikan seluruh status yang valid dalam sistem", () => {
    expect(ALLOWED_STATUSES).toContain("PENDING");
    expect(ALLOWED_STATUSES).toContain("PAID");
    expect(ALLOWED_STATUSES).toContain("SUCCESS");
    expect(ALLOWED_STATUSES).toContain("CONFIRMED");
    expect(ALLOWED_STATUSES).toContain("ACCEPTED");
    expect(ALLOWED_STATUSES).toContain("APPROVED");
    expect(ALLOWED_STATUSES).toContain("CANCELLED");
    expect(ALLOWED_STATUSES).toContain("REJECTED");
    expect(ALLOWED_STATUSES).toContain("REFUND_REQUESTED");
    expect(ALLOWED_STATUSES).toContain("REFUNDED");
    expect(ALLOWED_STATUSES).toContain("COMPLETED");
  });

  it("RESERVED_BOOKING_STATUSES memuat seluruh status yang menahan kuota inventaris kamar (termasuk PENDING)", () => {
    expect(RESERVED_BOOKING_STATUSES).toEqual([
      "PENDING",
      "PAID",
      "SUCCESS",
      "CONFIRMED",
      "ACCEPTED",
      "APPROVED",
      "COMPLETED",
    ]);
    expect(RESERVED_BOOKING_STATUSES).toContain("PENDING");
  });

  it("PAID_CONFIRMED_STATUSES hanya memuat status lunas/terkonfirmasi dan TIDAK menyertakan PENDING", () => {
    expect(PAID_CONFIRMED_STATUSES).toEqual([
      "APPROVED",
      "ACCEPTED",
      "PAID",
      "SUCCESS",
      "CONFIRMED",
    ]);
    expect(PAID_CONFIRMED_STATUSES).not.toContain("PENDING");
    expect(PAID_CONFIRMED_STATUSES).not.toContain("CANCELLED");
    expect(PAID_CONFIRMED_STATUSES).not.toContain("REJECTED");
  });

  it("ACTIVE_BOOKING_STATUSES tetap tersedia sebagai alias RESERVED_BOOKING_STATUSES untuk backward compatibility", () => {
    expect(ACTIVE_BOOKING_STATUSES).toBe(RESERVED_BOOKING_STATUSES);
    expect(ACTIVE_BOOKING_STATUSES).toEqual(RESERVED_BOOKING_STATUSES);
  });
});
