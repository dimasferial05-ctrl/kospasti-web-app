import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  verifyOwnerToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findMany: vi.fn(),
    },
    booking: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/partner/stats/route";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

describe("GET /api/partner/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when partner token is missing", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("should return 401 when token verification fails", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "invalid-token" }),
    } as never);
    vi.mocked(verifyOwnerToken).mockResolvedValue(null as never);

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("should calculate stats efficiently without include bookings", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-token" }),
    } as never);
    vi.mocked(verifyOwnerToken).mockResolvedValue({ ownerId: "owner-1" } as never);

    vi.mocked(prisma.property.findMany).mockResolvedValue([
      { id: "prop-1", available_rooms: 3 },
      { id: "prop-2", available_rooms: 2 },
    ] as never);

    vi.mocked(prisma.booking.groupBy).mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 } },
      { status: "PAID", _count: { _all: 1 } },
      { status: "APPROVED", _count: { _all: 3 } },
      { status: "ACCEPTED", _count: { _all: 1 } },
      { status: "REJECTED", _count: { _all: 2 } },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.stats).toEqual({
      totalProperties: 2,
      totalAvailableRooms: 5,
      totalBookings: 9,
      pendingBookings: 3,
      approvedBookings: 4,
      rejectedBookings: 2,
    });

    // Verifikasi bahwa include bookings TIDAK dipanggil pada kueri properti
    expect(prisma.property.findMany).toHaveBeenCalledWith({
      where: { owner_id: "owner-1" },
      select: {
        id: true,
        available_rooms: true,
      },
    });

    // Verifikasi groupBy dipanggil untuk booking
    expect(prisma.booking.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: {
        property_id: { in: ["prop-1", "prop-2"] },
      },
      _count: {
        _all: true,
      },
    });

    // Pastikan booking.findMany TIDAK dipanggil sama sekali
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
  });

  it("should handle owner with no properties without querying bookings", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-token" }),
    } as never);
    vi.mocked(verifyOwnerToken).mockResolvedValue({ ownerId: "owner-empty" } as never);

    vi.mocked(prisma.property.findMany).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.stats).toEqual({
      totalProperties: 0,
      totalAvailableRooms: 0,
      totalBookings: 0,
      pendingBookings: 0,
      approvedBookings: 0,
      rejectedBookings: 0,
    });

    // Kueri booking tidak boleh dipanggil jika propertyIds kosong
    expect(prisma.booking.groupBy).not.toHaveBeenCalled();
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
  });
});
