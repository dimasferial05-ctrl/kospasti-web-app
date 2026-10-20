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

  it("should have index on Booking property_id, user_id, and status", () => {
    const bookingMatch = schemaContent.match(/model Booking \{([\s\S]*?)\n\}/);
    expect(bookingMatch).toBeTruthy();
    const bookingBlock = bookingMatch ? bookingMatch[1] : "";
    expect(bookingBlock).toContain("@@index([property_id])");
    expect(bookingBlock).toContain("@@index([user_id])");
    expect(bookingBlock).toContain("@@index([status])");
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
});
