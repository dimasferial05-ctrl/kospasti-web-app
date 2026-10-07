import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as eligibilityGET } from "../src/app/api/properties/[id]/reviews/eligibility/route";
import { POST as reviewsPOST } from "../src/app/api/properties/[id]/reviews/route";
import { prisma } from "../src/lib/prisma";
import { signUserToken } from "../src/lib/auth";
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

describe("Review Eligibility & Submission for APPROVED / ACCEPTED Bookings (Issue #221)", () => {
  const propertyId = "prop-test-123";
  const userId = "user-test-456";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function setupAuthToken() {
    const token = await signUserToken({
      userId,
      email: "tenant@example.com",
      name: "Tenant Test",
    });
    mockCookiesStore.set("user_token", token);
    return token;
  }

  describe("GET /api/properties/[id]/reviews/eligibility", () => {
    it("mengizinkan ulasan (eligible: true) jika booking berstatus APPROVED", async () => {
      await setupAuthToken();

      const mockBooking = {
        id: "booking-approved-1",
        property_id: propertyId,
        user_id: userId,
        status: "APPROVED",
        review: null,
      };

      const findManySpy = vi
        .spyOn(prisma.booking, "findMany")
        .mockResolvedValue([mockBooking as any]);

      const req = new NextRequest(
        `http://localhost:3000/api/properties/${propertyId}/reviews/eligibility`
      );
      const res = await eligibilityGET(req, {
        params: Promise.resolve({ id: propertyId }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.eligible).toBe(true);
      expect(data.data.booking_id).toBe("booking-approved-1");

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: expect.arrayContaining(["APPROVED", "ACCEPTED", "PAID", "SUCCESS"]),
            },
          }),
        })
      );
    });

    it("mengizinkan ulasan (eligible: true) jika booking berstatus ACCEPTED", async () => {
      await setupAuthToken();

      const mockBooking = {
        id: "booking-accepted-1",
        property_id: propertyId,
        user_id: userId,
        status: "ACCEPTED",
        review: null,
      };

      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([mockBooking as any]);

      const req = new NextRequest(
        `http://localhost:3000/api/properties/${propertyId}/reviews/eligibility`
      );
      const res = await eligibilityGET(req, {
        params: Promise.resolve({ id: propertyId }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.eligible).toBe(true);
      expect(data.data.booking_id).toBe("booking-accepted-1");
    });
  });

  describe("POST /api/properties/[id]/reviews", () => {
    it("berhasil mengirimkan ulasan jika booking spesifik (booking_id) berstatus APPROVED", async () => {
      await setupAuthToken();

      const mockBooking = {
        id: "booking-approved-1",
        property_id: propertyId,
        user_id: userId,
        status: "APPROVED",
        review: null,
      };

      const findFirstSpy = vi
        .spyOn(prisma.booking, "findFirst")
        .mockResolvedValue(mockBooking as any);

      const createSpy = vi.spyOn(prisma.review, "create").mockResolvedValue({
        id: "review-new-1",
        rating: 5,
        comment: "Kos sangat bagus dan bersih!",
        property_id: propertyId,
        user_id: userId,
        booking_id: "booking-approved-1",
        user: {
          id: userId,
          name: "Tenant Test",
          avatar: null,
        },
      } as any);

      const req = new NextRequest(
        `http://localhost:3000/api/properties/${propertyId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: 5,
            comment: "Kos sangat bagus dan bersih!",
            booking_id: "booking-approved-1",
          }),
        }
      );

      const res = await reviewsPOST(req, {
        params: Promise.resolve({ id: propertyId }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain("berhasil dikirim");
      expect(findFirstSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: expect.arrayContaining(["APPROVED", "ACCEPTED", "PAID", "SUCCESS"]),
            },
          }),
        })
      );
      expect(createSpy).toHaveBeenCalled();
    });

    it("berhasil mengirimkan ulasan tanpa booking_id jika booking terakhir berstatus ACCEPTED", async () => {
      await setupAuthToken();

      const mockBooking = {
        id: "booking-accepted-2",
        property_id: propertyId,
        user_id: userId,
        status: "ACCEPTED",
        review: null,
      };

      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([mockBooking as any]);
      vi.spyOn(prisma.review, "create").mockResolvedValue({
        id: "review-new-2",
        rating: 4,
        comment: "Lokasi strategis dekat kampus",
        property_id: propertyId,
        user_id: userId,
        booking_id: "booking-accepted-2",
        user: {
          id: userId,
          name: "Tenant Test",
          avatar: null,
        },
      } as any);

      const req = new NextRequest(
        `http://localhost:3000/api/properties/${propertyId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: 4,
            comment: "Lokasi strategis dekat kampus",
          }),
        }
      );

      const res = await reviewsPOST(req, {
        params: Promise.resolve({ id: propertyId }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("review-new-2");
    });
  });
});
