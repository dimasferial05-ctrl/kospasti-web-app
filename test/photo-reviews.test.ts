import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GET as reviewsGET,
  POST as reviewsPOST,
} from "../src/app/api/properties/[id]/reviews/route";
import { prisma } from "../src/lib/prisma";
import { signUserToken } from "../src/lib/auth";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

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

// Mock saveUploadedFiles from @/lib/upload so unit tests don't depend on external Supabase storage or write actual files
vi.mock("@/lib/upload", () => ({
  saveUploadedFiles: vi.fn(async (files: File[], subfolder = "general") => {
    return files.map((f, i) => ({
      url: `/uploads/${subfolder}/mock-${Date.now()}-${i}-${f.name}`,
      type: "IMAGE" as const,
    }));
  }),
}));

describe("Photo Reviews Feature (Issue #402)", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function createFixture() {
    const owner = await prisma.owner.create({
      data: {
        name: "Ibu Indah",
        whatsapp_number: "081234567899",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Graha Mulia",
        price_per_month: 1200000,
        available_rooms: 4,
        gender_type: "PUTRI",
        facilities: "WiFi, Kamar Mandi Dalam, Kasur Springbed",
        owner_id: owner.id,
        status: "PUBLISHED",
      },
    });

    const user1 = await prisma.user.create({
      data: {
        name: "Alya Zahra",
        email: "alya@example.com",
        whatsapp: "081234111222",
        avatar: "https://example.com/alya.jpg",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: "Nadira Putri",
        email: "nadira@example.com",
        whatsapp: "081234333444",
      },
    });

    return { owner, property, user1, user2 };
  }

  describe("POST /api/properties/[id]/reviews with Photos", () => {
    it("berhasil membuat ulasan dengan 1-3 foto kamar riil via multipart/form-data", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "081234111222",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const formData = new FormData();
      formData.append("rating", "5");
      formData.append("comment", "Kamar sangat bersih dan sesuai foto!");
      formData.append("booking_id", booking.id);

      const fakeFile1 = new File(["dummy content 1"], "kamar-tidur.jpg", { type: "image/jpeg" });
      const fakeFile2 = new File(["dummy content 2"], "kamar-mandi.png", { type: "image/png" });
      formData.append("images", fakeFile1);
      formData.append("images", fakeFile2);

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: formData,
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.rating).toBe(5);
      expect(data.data.images).toBeTruthy();

      const parsedImages = JSON.parse(data.data.images);
      expect(Array.isArray(parsedImages)).toBe(true);
      expect(parsedImages.length).toBe(2);
      expect(parsedImages[0]).toContain("/uploads/reviews/");
    });

    it("menolak request jika pengguna mengunggah lebih dari 3 foto", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "081234111222",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const formData = new FormData();
      formData.append("rating", "5");
      formData.append("booking_id", booking.id);

      for (let i = 1; i <= 4; i++) {
        formData.append("images", new File([`dummy ${i}`], `photo-${i}.jpg`, { type: "image/jpeg" }));
      }

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: formData,
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Maksimal 3 foto");
    });

    it("menolak request jika file yang diunggah bukan format gambar yang valid", async () => {
      const { property, user1 } = await createFixture();

      const booking = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "081234111222",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
      mockCookiesStore.set("user_token", token);

      const formData = new FormData();
      formData.append("rating", "4");
      formData.append("booking_id", booking.id);
      formData.append("images", new File(["malicious script"], "payload.pdf", { type: "application/pdf" }));

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`, {
        method: "POST",
        body: formData,
      });

      const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("tidak didukung");
    });
  });

  describe("GET /api/properties/[id]/reviews Aggregation & Community Gallery", () => {
    it("mengembalikan allPhotos, photoReviewsCount, dan images untuk galeri komunitas penghuni", async () => {
      const { property, user1, user2 } = await createFixture();

      const booking1 = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "081234111222",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      const booking2 = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user2.id,
          student_name: user2.name,
          student_whatsapp: "081234333444",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      // Review 1 with 2 photos
      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking1.id,
          rating: 5,
          comment: "Bagus sekali dan luas",
          images: JSON.stringify(["https://example.com/p1.jpg", "https://example.com/p2.jpg"]),
        },
      });

      // Review 2 without photos
      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user2.id,
          booking_id: booking2.id,
          rating: 4,
          comment: "Lumayan tenang",
        },
      });

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`);
      const res = await reviewsGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.totalReviews).toBe(2);
      expect(data.data.stats.photoReviewsCount).toBe(1);
      expect(Array.isArray(data.data.allPhotos)).toBe(true);
      expect(data.data.allPhotos.length).toBe(2);
      expect(data.data.allPhotos[0].studentName).toBe(user1.name);
      expect(data.data.allPhotos[0].rating).toBe(5);
    });

    it("tidak memasukkan foto dari ulasan yang disembunyikan (is_hidden: true) ke galeri komunitas", async () => {
      const { property, user1 } = await createFixture();

      const booking1 = await prisma.booking.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          student_name: user1.name,
          student_whatsapp: "081234111222",
          move_in_date: new Date(),
          status: "SUCCESS",
        },
      });

      // Review with photos but hidden by admin moderation
      await prisma.review.create({
        data: {
          property_id: property.id,
          user_id: user1.id,
          booking_id: booking1.id,
          rating: 1,
          comment: "Spam komentar",
          images: JSON.stringify(["https://example.com/spam.jpg"]),
          is_hidden: true,
        },
      });

      const req = new NextRequest(`http://localhost/api/properties/${property.id}/reviews`);
      const res = await reviewsGET(req, { params: Promise.resolve({ id: property.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats.totalReviews).toBe(0);
      expect(data.data.stats.photoReviewsCount).toBe(0);
      expect(data.data.allPhotos.length).toBe(0);
    });
  });

  describe("Anti-Slop Guidelines Verification", () => {
    it("tidak mengandung emoji teks mentah di ReviewSection.tsx", () => {
      const reviewSectionPath = path.resolve(__dirname, "../src/components/features/ReviewSection.tsx");
      const content = fs.readFileSync(reviewSectionPath, "utf-8");

      // Check for forbidden emoji characters
      const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      const match = content.match(emojiRegex);
      expect(match).toBeNull();
    });

    it("menggunakan domain-appropriate icon Lucide React untuk kamera dan foto", () => {
      const reviewSectionPath = path.resolve(__dirname, "../src/components/features/ReviewSection.tsx");
      const content = fs.readFileSync(reviewSectionPath, "utf-8");

      expect(content).toContain("<Camera");
      expect(content).toContain("<ImagePlus");
      expect(content).toContain("<Maximize2");
    });
  });
});
