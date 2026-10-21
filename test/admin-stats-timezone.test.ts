import { describe, it, expect, vi } from "vitest";
import { getWibDayRange, WIB_OFFSET_HOURS, WIB_OFFSET_MS } from "@/lib/date-utils";
import { GET } from "@/app/api/admin/stats/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as adminAuth from "@/lib/admin-auth";

describe("WIB Day Range & Admin Stats Timezone Tests", () => {
  it("1. Konfigurasi offset WIB harus tepat +7 jam", () => {
    expect(WIB_OFFSET_HOURS).toBe(7);
    expect(WIB_OFFSET_MS).toBe(7 * 60 * 60 * 1000);
  });

  it("2. Menghitung start dan end of day WIB dengan benar saat dini hari (misal 01:30 WIB)", () => {
    // 21 Oktober 2026, 01:30 WIB = 20 Oktober 2026, 18:30 UTC
    const mockUtcTime = new Date(Date.UTC(2026, 9, 20, 18, 30, 0));
    const { startOfToday, endOfToday } = getWibDayRange(mockUtcTime);

    // Start of day harus 21 Oktober 2026, 00:00:00 WIB = 20 Oktober 2026, 17:00:00 UTC
    expect(startOfToday.toISOString()).toBe("2026-10-20T17:00:00.000Z");

    // End of day harus 21 Oktober 2026, 23:59:59.999 WIB = 21 Oktober 2026, 16:59:59.999 UTC
    expect(endOfToday.toISOString()).toBe("2026-10-21T16:59:59.999Z");
  });

  it("3. Menghitung rentang WIB dengan tepat saat siang hari (misal 14:00 WIB)", () => {
    // 21 Oktober 2026, 14:00 WIB = 21 Oktober 2026, 07:00 UTC
    const mockUtcTime = new Date(Date.UTC(2026, 9, 21, 7, 0, 0));
    const { startOfToday, endOfToday } = getWibDayRange(mockUtcTime);

    expect(startOfToday.toISOString()).toBe("2026-10-20T17:00:00.000Z");
    expect(endOfToday.toISOString()).toBe("2026-10-21T16:59:59.999Z");
  });

  it("4. Menghitung rentang WIB dengan tepat saat menjelang tengah malam (misal 23:59:59 WIB)", () => {
    // 21 Oktober 2026, 23:59:59 WIB = 21 Oktober 2026, 16:59:59 UTC
    const mockUtcTime = new Date(Date.UTC(2026, 9, 21, 16, 59, 59));
    const { startOfToday, endOfToday } = getWibDayRange(mockUtcTime);

    expect(startOfToday.toISOString()).toBe("2026-10-20T17:00:00.000Z");
    expect(endOfToday.toISOString()).toBe("2026-10-21T16:59:59.999Z");
  });

  it("5. Pergantian tanggal WIB terjadi tepat pada 00:00:00 WIB (17:00:00 UTC)", () => {
    // 22 Oktober 2026, 00:00:00 WIB = 21 Oktober 2026, 17:00:00 UTC
    const mockMidnightWib = new Date(Date.UTC(2026, 9, 21, 17, 0, 0));
    const { startOfToday, endOfToday } = getWibDayRange(mockMidnightWib);

    // Tanggal sekarang harus sudah 22 Oktober 2026 WIB (21 Oktober 2026, 17:00 UTC)
    expect(startOfToday.toISOString()).toBe("2026-10-21T17:00:00.000Z");
    expect(endOfToday.toISOString()).toBe("2026-10-22T16:59:59.999Z");
  });

  it("6. Endpoint GET /api/admin/stats menggunakan kueri created_at dengan rentang WIB", async () => {
    // Mock valid admin
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);

    // Mock prisma methods
    vi.spyOn(prisma.property, "count").mockResolvedValue(10);
    const bookingCountSpy = vi.spyOn(prisma.booking, "count").mockResolvedValue(5);
    vi.spyOn(prisma.property, "aggregate").mockResolvedValue({
      _sum: { available_rooms: 25 },
      _avg: {},
      _count: {},
      _max: {},
      _min: {},
    });
    vi.spyOn(prisma.booking, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.magicLink, "findMany").mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/admin/stats");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.properties).toBe(10);
    expect(body.data.rooms).toBe(25);

    // Periksa bahwa booking.count dipanggil dua kali:
    // Panggilan kedua memiliki filter created_at gte dan lte
    expect(bookingCountSpy).toHaveBeenCalledTimes(2);
    const secondCallArg = bookingCountSpy.mock.calls[1][0];
    expect(secondCallArg?.where?.created_at?.gte).toBeInstanceOf(Date);
    expect(secondCallArg?.where?.created_at?.lte).toBeInstanceOf(Date);

    vi.restoreAllMocks();
  });
});
