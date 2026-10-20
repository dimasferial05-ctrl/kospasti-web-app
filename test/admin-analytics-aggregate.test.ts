import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    property: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/admin-auth", () => ({
  isValidAdminRequest: vi.fn(),
  createAdminUnauthorizedResponse: vi.fn(() =>
    new Response(JSON.stringify({ success: false, message: "Unauthorized: Admin access required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  ),
}));

import { GET } from "@/app/api/admin/analytics/route";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest } from "@/lib/admin-auth";

describe("Admin Analytics API Endpoint with Database Aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 unauthorized when request is not from an authenticated admin", async () => {
    vi.mocked(isValidAdminRequest).mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/admin/analytics");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("Unauthorized");
  });

  it("should calculate metrics using database aggregates and bounded date queries", async () => {
    vi.mocked(isValidAdminRequest).mockReturnValue(true);

    // Mock aggregate calls
    vi.mocked(prisma.booking.aggregate)
      .mockResolvedValueOnce({
        _sum: { amount: 5000000 },
        _count: { _all: 5 },
      } as never) // Total
      .mockResolvedValueOnce({
        _sum: { amount: 2000000 },
      } as never) // This Month
      .mockResolvedValueOnce({
        _sum: { amount: 1500000 },
      } as never); // Last Month

    // Mock 6 months bounded findMany
    const mockRecentBookings = [
      {
        id: "b1",
        created_at: new Date(),
        status: "SUCCESS",
        amount: 1000000,
        property_id: "prop-1",
        room_type: null,
        property: {
          id: "prop-1",
          name: "Kost Melati",
          price_per_month: 1000000,
          owner: { name: "Ibu Melati", whatsapp_number: "08123456789" },
        },
      },
    ];
    vi.mocked(prisma.booking.findMany).mockResolvedValueOnce(mockRecentBookings as never);

    // Mock groupBy for top properties
    vi.mocked(prisma.booking.groupBy).mockResolvedValueOnce([
      {
        property_id: "prop-1",
        _sum: { amount: 3000000 },
        _count: { _all: 3 },
      },
      {
        property_id: "prop-2",
        _sum: { amount: 2000000 },
        _count: { _all: 2 },
      },
    ] as never);

    // Mock property details for top properties
    vi.mocked(prisma.property.findMany).mockResolvedValueOnce([
      {
        id: "prop-1",
        name: "Kost Melati",
        owner: { name: "Ibu Melati" },
      },
      {
        id: "prop-2",
        name: "Kost Mawar",
        owner: { name: "Pak Mawar" },
      },
    ] as never);

    const req = new NextRequest("http://localhost:3000/api/admin/analytics");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.totalGtv).toBe(5000000);
    expect(json.data.successfulBookingsCount).toBe(5);
    expect(json.data.thisMonthGtv).toBe(2000000);
    expect(json.data.lastMonthGtv).toBe(1500000);
    expect(json.data.averageOrderValue).toBe(1000000);
    expect(typeof json.data.gtvGrowth).toBe("number");
    expect(Array.isArray(json.data.monthlyTrend)).toBe(true);
    expect(json.data.topProperties).toHaveLength(2);
    expect(json.data.topProperties[0]).toEqual({
      id: "prop-1",
      name: "Kost Melati",
      ownerName: "Ibu Melati",
      revenue: 3000000,
      bookingsCount: 3,
    });

    // Check that groupBy was called with take: 5
    expect(prisma.booking.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["property_id"],
        take: 5,
        orderBy: { _sum: { amount: "desc" } },
      })
    );

    // Check that findMany bounded 6 months
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    );
  });
});
