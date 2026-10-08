import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as propertyReviewsGET } from "../src/app/api/properties/[id]/reviews/route";
import { prisma } from "../src/lib/prisma";
import { NextRequest } from "next/server";

describe("Property Reviews - Owner Reply Profile (Issue #227)", () => {
  const propertyId = "prop-test-123";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan data ulasan beserta relasi property owner name", async () => {
    const mockReviews = [
      {
        id: "rev-1",
        rating: 5,
        comment: "Kamar bersih dan nyaman!",
        reply: "Terima kasih banyak, semoga betah!",
        replied_at: new Date("2026-10-07T10:00:00Z"),
        is_hidden: false,
        created_at: new Date("2026-10-06T10:00:00Z"),
        user: {
          id: "user-1",
          name: "Rizky Mahasiswa",
          avatar: null,
        },
        property: {
          owner: {
            name: "Haji Sulaiman",
          },
        },
      },
      {
        id: "rev-2",
        rating: 4,
        comment: "Lokasi strategis dekat kampus",
        reply: null,
        replied_at: null,
        is_hidden: false,
        created_at: new Date("2026-10-05T10:00:00Z"),
        user: {
          id: "user-2",
          name: "Anisa Putri",
          avatar: "https://example.com/avatar.jpg",
        },
        property: {
          owner: {
            name: "Haji Sulaiman",
          },
        },
      },
    ];

    const findManySpy = vi.spyOn(prisma.review, "findMany").mockResolvedValue(mockReviews as any);

    const req = new NextRequest(`http://localhost:3000/api/properties/${propertyId}/reviews`);
    const res = await propertyReviewsGET(req, {
      params: Promise.resolve({ id: propertyId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.reviews).toHaveLength(2);

    // Verifikasi pemanggilan prisma.review.findMany menyertakan relasi property.owner.name
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          property_id: propertyId,
          is_hidden: false,
        },
        include: expect.objectContaining({
          user: expect.any(Object),
          property: {
            select: {
              owner: {
                select: {
                  name: true,
                },
              },
            },
          },
        }),
      })
    );

    // Verifikasi data yang dikembalikan memiliki nama pemilik
    const reviewWithReply = json.data.reviews[0];
    expect(reviewWithReply.reply).toBe("Terima kasih banyak, semoga betah!");
    expect(reviewWithReply.property?.owner?.name).toBe("Haji Sulaiman");
  });

  it("menangani ulasan ketika property atau owner bernilai null/undefined tanpa error", async () => {
    const mockReviews = [
      {
        id: "rev-orphan",
        rating: 5,
        comment: "Bagus",
        reply: "Siap makasih",
        replied_at: new Date(),
        is_hidden: false,
        created_at: new Date(),
        user: { id: "user-3", name: "User", avatar: null },
        property: null,
      },
    ];

    vi.spyOn(prisma.review, "findMany").mockResolvedValue(mockReviews as any);

    const req = new NextRequest(`http://localhost:3000/api/properties/${propertyId}/reviews`);
    const res = await propertyReviewsGET(req, {
      params: Promise.resolve({ id: propertyId }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.reviews[0].property).toBeNull();
  });
});
