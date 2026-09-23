import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as eligibilityGET } from "../src/app/api/properties/[id]/reviews/eligibility/route";
import {
  GET as reviewsGET,
  POST as reviewsPOST,
} from "../src/app/api/properties/[id]/reviews/route";
import { GET as propertiesGET } from "../src/app/api/properties/route";
import { GET as singlePropertyGET } from "../src/app/api/properties/[id]/route";
import { GET as adminReviewsGET } from "../src/app/api/admin/reviews/route";
import { PATCH as adminReviewPATCH } from "../src/app/api/admin/reviews/[id]/route";
import { prisma } from "../src/lib/prisma";
import { signUserToken } from "../src/lib/auth";
import { clearDatabase } from "./helpers";
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

describe("Review & Rating Feature (Issue #118)", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function createFixture() {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Nurul",
        whatsapp_number: "081234567890",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Nyaman Harmoni",
        price_per_month: 900000,
        available_rooms: 3,
        gender_type: "CAMPUR",
        facilities: "WiFi, AC, Kasur",
        owner_id: owner.id,
      },
    });

    const user1 = await prisma.user.create({
      data: {
        name: "Budi Santoso",
        email: "budi@example.com",
        whatsapp: "08111222333",
        avatar: "https://example.com/avatar1.jpg",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: "Siti Rahma",
        email: "siti@example.com",
        whatsapp: "08222333444",
      },
    });

    return { owner, property, user1, user2 };
  }

  describe("GET /api/properties/[id]/reviews/eligibility", () => {
    it("mengembalikan eligible: false dengan alasan NOT_LOGGED_IN jika belum login", async () => {
      const { property } = await createFixture();

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews/eligibility`);
      const res = await eligibilityGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.eligible).toBe(false);
      expect(data.data.reason).toBe("NOT_LOGGED_IN");
    });

    it("mengembalikan eligible: false dengan alasan NO_VERIFIED_BOOKING jika user belum pernah booking atau booking belum sukses", async () => {
      const { property, user1 } = await createFixture();

      // Booking status masih PENDING
      await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "PENDING",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews/eligibility`);
      const res = await eligibilityGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.eligible).toBe(false);
      expect(data.data.reason).toBe("NO_VERIFIED_BOOKING");
    });

    it("mengembalikan eligible: true dengan booking_id jika user memiliki booking SUCCESS yang belum diulas", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews/eligibility`);
      const res = await eligibilityGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.eligible).toBe(true);
      expect(data.data.booking_id).toBe(booking.id);
    });

    it("mengembalikan eligible: false dengan alasan ALREADY_REVIEWED jika booking sudah pernah diulas", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "PAID",
        },
      });

      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking.id,
          rating: 5,
          comment: "Kos sangat bersih dan nyaman",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews/eligibility`);
      const res = await eligibilityGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.eligible).toBe(false);
      expect(data.data.reason).toBe("ALREADY_REVIEWED");
    });
  });

  describe("POST /api/properties/[id]/reviews", () => {
    it("menolak request (401) jika belum login", async () => {
      const { property } = await createFixture();

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "Keren" }),
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("menolak request (400) jika rating tidak valid (misal: 0 atau 6)", async () => {
      const { property, user1 } = await createFixture();
      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 6 }),
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("1 sampai 5");
    });

    it("menolak request (403) jika user bukan penyewa terverifikasi", async () => {
      const { property, user1 } = await createFixture();
      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: 5, comment: "Mencoba mereview tanpa booking" }),
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("terverifikasi");
    });

    it("berhasil membuat review baru (201) untuk penyewa terverifikasi", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: 4,
          comment: "Ibu kos ramah sekali, fasilitas sesuai deskripsi.",
          booking_id: booking.id,
        }),
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.rating).toBe(4);
      expect(data.data.comment).toBe("Ibu kos ramah sekali, fasilitas sesuai deskripsi.");
      expect(data.data.booking_id).toBe(booking.id);

      // Verifikasi di database
      const reviewInDb = await prisma.review.findUnique({
        where: { booking_id: booking.id },
      });
      expect(reviewInDb).not.toBeNull();
      expect(reviewInDb?.rating).toBe(4);
    });

    it("menolak request (409) jika booking tersebut sudah memiliki review", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking.id,
          rating: 5,
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: 4,
          comment: "Review kedua pada booking yang sama",
          booking_id: booking.id,
        }),
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
    });
  });

  describe("GET /api/properties/[id]/reviews & Aggregation", () => {
    it("menghitung statistik rating dan mengecualikan ulasan yang disembunyikan (is_hidden: true)", async () => {
      const { property, user1, user2 } = await createFixture();

      const booking1 = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const booking2 = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user2.id,
          student_name: user2.name,
          student_whatsapp: "08222333444",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      // Review 1: Bintang 5 (Publik)
      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking1.id,
          rating: 5,
          comment: "Bagus banget",
          is_hidden: false,
        },
      });

      // Review 2: Bintang 1 (Disembunyikan oleh moderasi admin)
      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user2.id,
          booking_id: booking2.id,
          rating: 1,
          comment: "Komentar kasar/fitnah",
          is_hidden: true,
        },
      });

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`);
      const res = await reviewsGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.reviews.length).toBe(1); // Hanya 1 yang tampil publik
      expect(data.data.reviews[0].comment).toBe("Bagus banget");
      expect(data.data.stats.totalReviews).toBe(1);
      expect(data.data.stats.averageRating).toBe(5);
      expect(data.data.stats.distribution[5]).toBe(1);
      expect(data.data.stats.distribution[1]).toBe(0);
    });

    it("mengembalikan average_rating dan total_reviews pada endpoint GET /api/properties dan GET /api/properties/[id]", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking.id,
          rating: 4,
          comment: "Nyaman dan strategis",
        },
      });

      // Test GET /api/properties
      const listRes = await propertiesGET();
      const listData = await listRes.json();
      expect(listRes.status).toBe(200);
      const matchedProperty = listData.data.find((p: { id: string }) => p.id === property.id);
      expect(matchedProperty.average_rating).toBe(4);
      expect(matchedProperty.total_reviews).toBe(1);

      // Test GET /api/properties/[id]
      const singleRes = await singlePropertyGET(new Request("http://localhost"), {
        params: Promise.resolve({ id: property.id }),
      });
      const singleData = await singleRes.json();
      expect(singleRes.status).toBe(200);
      expect(singleData.data.average_rating).toBe(4);
      expect(singleData.data.total_reviews).toBe(1);
    });
  });

  describe("Admin Review Moderation (GET & PATCH /api/admin/reviews)", () => {
    it("menolak request admin (401) jika tanpa cookie admin_token", async () => {
      const req = new NextRequest("http://localhost/api/admin/reviews");
      const res = await adminReviewsGET(req);
      expect(res.status).toBe(401);
    });

    it("berhasil mengambil seluruh review (termasuk yang disembunyikan) untuk admin", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const review = await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking.id,
          rating: 2,
          comment: "Perlu perbaikan kamar mandi",
          is_hidden: true,
        },
      });

      const req = new NextRequest("http://localhost/api/admin/reviews", {
        headers: {
          cookie: "admin_token=mock_admin_token",
        },
      });

      const res = await adminReviewsGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.length).toBe(1);
      expect(data.data[0].id).toBe(review.id);
      expect(data.data[0].is_hidden).toBe(true);
    });

    it("berhasil mengubah status is_hidden (moderasi) melalui PATCH /api/admin/reviews/[id]", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "08111222333",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const review = await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking.id,
          rating: 1,
          comment: "Ulasan spam",
          is_hidden: false,
        },
      });

      const patchReq = new NextRequest(`http://localhost/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: {
          cookie: "admin_token=mock_admin_token",
        },
        body: JSON.stringify({ is_hidden: true }),
      });

      const patchRes = await adminReviewPATCH(patchReq, {
        params: Promise.resolve({ id: review.id }),
      });
      const patchData = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchData.success).toBe(true);
      expect(patchData.data.is_hidden).toBe(true);

      // Verifikasi di DB
      const updatedInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(updatedInDb?.is_hidden).toBe(true);
    });
  });
});
