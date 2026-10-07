import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as partnerReviewsGET } from "../src/app/api/partner/reviews/route";
import { GET as ownerReviewsGET } from "../src/app/api/owner/reviews/route";
import { prisma } from "../src/lib/prisma";
import { signOwnerToken } from "../src/lib/auth";
import { NextRequest } from "next/server";

// Mock next/headers cookies
const mockCookiesStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = mockCookiesStore.get(key);
      return val ? { name: key, value: val } : undefined;
    },
    set: (obj: { name: string; value: string }) => {
      mockCookiesStore.set(obj.name, obj.value);
    },
  })),
}));

describe("Partner Reviews Dashboard API (Issue #223)", () => {
  const ownerId = "owner-test-123";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function setupPartnerToken() {
    const token = await signOwnerToken({
      ownerId,
      name: "Owner Test",
      whatsapp_number: "6281234567890",
    });
    mockCookiesStore.set("partner_token", token);
    return token;
  }

  it("mengembalikan 401 Unauthorized jika tidak ada partner_token", async () => {
    const req = new NextRequest("http://localhost:3000/api/partner/reviews");
    const res = await partnerReviewsGET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("mengembalikan daftar ulasan dan statistik untuk mitra yang login", async () => {
    await setupPartnerToken();

    const mockProperties = [
      {
        id: "prop-1",
        name: "Kos Melati",
        image_url: null,
        room_types: [
          { id: "rt-1", name: "Tipe Deluxe AC", price_per_month: 1500000 },
        ],
      },
    ];

    const mockReviews = [
      {
        id: "rev-1",
        rating: 5,
        comment: "Kos sangat nyaman dan bersih!",
        created_at: new Date("2026-10-01T10:00:00Z"),
        user: {
          id: "user-1",
          name: "Budi Santoso",
          avatar: null,
          email: "budi@example.com",
        },
        property: {
          id: "prop-1",
          name: "Kos Melati",
          image_url: null,
          address: "Jl. Mawar No. 1",
        },
        booking: {
          id: "book-1",
          student_name: "Budi Santoso",
          room_type_id: "rt-1",
          room_type: {
            id: "rt-1",
            name: "Tipe Deluxe AC",
            price_per_month: 1500000,
          },
        },
      },
    ];

    vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
    const reviewSpy = (vi.spyOn(prisma.review, "findMany") as any).mockImplementation(
      async (args?: any) => {
        // Jika query hanya select rating (untuk statistik)
        if (args?.select?.rating) {
          return [{ rating: 5 }] as any;
        }
        return mockReviews as any;
      }
    );

    const req = new NextRequest("http://localhost:3000/api/partner/reviews");
    const res = await partnerReviewsGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].comment).toBe("Kos sangat nyaman dan bersih!");
    expect(data.reviews[0].booking.room_type.name).toBe("Tipe Deluxe AC");
    expect(data.properties).toHaveLength(1);
    expect(data.stats.totalReviews).toBe(1);
    expect(data.stats.averageRating).toBe(5);
    expect(data.stats.positivePercentage).toBe(100);
    expect(data.stats.distribution[5]).toBe(1);

    expect(reviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          property: {
            owner_id: ownerId,
          },
        }),
      })
    );
  });

  it("menerapkan filter property_id, room_type_id, dan rating dengan tepat", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.property, "findMany").mockResolvedValue([] as any);
    const reviewSpy = vi.spyOn(prisma.review, "findMany").mockResolvedValue([] as any);

    const req = new NextRequest(
      "http://localhost:3000/api/partner/reviews?property_id=prop-1&room_type_id=rt-1&rating=4"
    );
    const res = await partnerReviewsGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reviews).toEqual([]);

    expect(reviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          property: {
            owner_id: ownerId,
          },
          property_id: "prop-1",
          booking: {
            room_type_id: "rt-1",
          },
          rating: 4,
        }),
      })
    );
  });

  it("alias /api/owner/reviews berfungsi sama persis dengan /api/partner/reviews", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.property, "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.review, "findMany").mockResolvedValue([] as any);

    const req = new NextRequest("http://localhost:3000/api/owner/reviews");
    const res = await ownerReviewsGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
