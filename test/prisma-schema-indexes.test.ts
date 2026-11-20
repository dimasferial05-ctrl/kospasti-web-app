import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Prisma Schema Index Definitions", () => {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  it("should have index on Property owner_id and status", () => {
    const propertyMatch = schemaContent.match(/model Property \{([\s\S]*?)\n\}/);
    expect(propertyMatch).toBeTruthy();
    const propertyBlock = propertyMatch ? propertyMatch[1] : "";
    expect(propertyBlock).toContain("@@index([owner_id])");
    expect(propertyBlock).toContain("@@index([status])");
  });

  it("should have index on Booking property_id, user_id, status, and composite indexes", () => {
    const bookingMatch = schemaContent.match(/model Booking \{([\s\S]*?)\n\}/);
    expect(bookingMatch).toBeTruthy();
    const bookingBlock = bookingMatch ? bookingMatch[1] : "";
    expect(bookingBlock).toContain("@@index([property_id])");
    expect(bookingBlock).toContain("@@index([user_id])");
    expect(bookingBlock).toContain("@@index([status])");
    expect(bookingBlock).toContain("@@index([user_id, status])");
    expect(bookingBlock).toContain("@@index([property_id, status])");
    expect(bookingBlock).toContain("@@index([room_unit_id])");
  });

  it("should have index on RoomType property_id", () => {
    const roomTypeMatch = schemaContent.match(/model RoomType \{([\s\S]*?)\n\}/);
    expect(roomTypeMatch).toBeTruthy();
    const roomTypeBlock = roomTypeMatch ? roomTypeMatch[1] : "";
    expect(roomTypeBlock).toContain("@@index([property_id])");
  });

  it("should have index on PropertyMedia property_id", () => {
    const mediaMatch = schemaContent.match(/model PropertyMedia \{([\s\S]*?)\n\}/);
    expect(mediaMatch).toBeTruthy();
    const mediaBlock = mediaMatch ? mediaMatch[1] : "";
    expect(mediaBlock).toContain("@@index([property_id])");
  });

  it("should have index on Payout owner_id and status", () => {
    const payoutMatch = schemaContent.match(/model Payout \{([\s\S]*?)\n\}/);
    expect(payoutMatch).toBeTruthy();
    const payoutBlock = payoutMatch ? payoutMatch[1] : "";
    expect(payoutBlock).toContain("@@index([owner_id])");
    expect(payoutBlock).toContain("@@index([status])");
  });

  it("should have index on Invoice booking_id, owner_id, user_id, status, due_date, and composite status_due_date", () => {
    const invoiceMatch = schemaContent.match(/model Invoice \{([\s\S]*?)\n\}/);
    expect(invoiceMatch).toBeTruthy();
    const invoiceBlock = invoiceMatch ? invoiceMatch[1] : "";
    expect(invoiceBlock).toContain("@@index([booking_id])");
    expect(invoiceBlock).toContain("@@index([owner_id])");
    expect(invoiceBlock).toContain("@@index([user_id])");
    expect(invoiceBlock).toContain("@@index([status])");
    expect(invoiceBlock).toContain("@@index([due_date])");
    expect(invoiceBlock).toContain("@@index([status, due_date])");
  });

  it("should have index on RoomUnit room_type_id, property_id, status, and composite property_id_status", () => {
    const roomUnitMatch = schemaContent.match(/model RoomUnit \{([\s\S]*?)\n\}/);
    expect(roomUnitMatch).toBeTruthy();
    const unitBlock = roomUnitMatch ? roomUnitMatch[1] : "";
    expect(unitBlock).toContain("@@index([room_type_id])");
    expect(unitBlock).toContain("@@index([property_id])");
    expect(unitBlock).toContain("@@index([status])");
    expect(unitBlock).toContain("@@index([property_id, status])");
    expect(unitBlock).toContain("@@unique([property_id, unit_number])");
  });
});
