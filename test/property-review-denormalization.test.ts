import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { updatePropertyReviewStats } from "../src/lib/propertyReviewStats";
import { GET as propertiesGET } from "../src/app/api/properties/route";
import { POST as reviewsPOST } from "../src/app/api/properties/[id]/reviews/route";
import { PATCH as adminReviewPATCH } from "../src/app/api/admin/reviews/[id]/route";
import { signUserToken } from "../src/lib/auth";
import { clearDatabase } from "./helpers";

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

describe("Property Review Stats Denormalization (Issue #440)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
    await clearDatabase();
  });

  async function createTestFixture() {
    const owner = await prisma.owner.create({
      data: {
        name: "Owner Test",
        whatsapp_number: "081234567890",
      },
    });

    const property = await prisma.property.create({
      data: {
        name: "Kos Pasti Nyaman",
        price_per_month: 1500000,
        available_rooms: 5,
        gender_type: "CAMPUR",
        facilities: "WiFi, AC, Kasur",
        owner_id: owner.id,
        status: "PUBLISHED",
      },
    });

    const user1 = await prisma.user.create({
      data: {
        name: "Mahasiswa 1",
        email: "mhs1@example.com",
        whatsapp: "081111111111",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: "Mahasiswa 2",
        email: "mhs2@example.com",
        whatsapp: "082222222222",
      },
    });

    const booking1 = await prisma.booking.create({
      data: {
        property_id: property.id,
        user_id: user1.id,
        student_name: user1.name,
        student_whatsapp: user1.whatsapp || "081111111111",
        move_in_date: new Date(),
        status: "SUCCESS",
      },
    });

    const booking2 = await prisma.booking.create({
      data: {
        property_id: property.id,
        user_id: user2.id,
        student_name: user2.name,
        student_whatsapp: user2.whatsapp || "082222222222",
        move_in_date: new Date(),
        status: "SUCCESS",
      },
    });

    return { owner, property, user1, user2, booking1, booking2 };
  }

  it("1. skema model Property memiliki kolom average_rating dan total_reviews dengan nilai awal default 0", async () => {
    const { property } = await createTestFixture();
    const fetched = await prisma.property.findUnique({
      where: { id: property.id },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.average_rating).toBe(0);
    expect(fetched?.total_reviews).toBe(0);
  });

  it("2. updatePropertyReviewStats mengagregasikan nilai rating database dan memperbarui Property secara presisi", async () => {
    const { property, user1, user2, booking1, booking2 } = await createTestFixture();

    // Buat ulasan 1 (rating 4)
    await prisma.review.create({
      data: {
        property_id: property.id,
        user_id: user1.id,
        booking_id: booking1.id,
        rating: 4,
        comment: "Kamar bagus dan bersih",
      },
    });

    let stats = await updatePropertyReviewStats(property.id);
    expect(stats.averageRating).toBe(4);
    expect(stats.totalReviews).toBe(1);

    let updatedProp = await prisma.property.findUnique({ where: { id: property.id } });
    expect(updatedProp?.average_rating).toBe(4);
    expect(updatedProp?.total_reviews).toBe(1);

    // Buat ulasan 2 (rating 5)
    await prisma.review.create({
      data: {
        property_id: property.id,
        user_id: user2.id,
        booking_id: booking2.id,
        rating: 5,
        comment: "Sangat puas, pemilik ramah",
      },
    });

    stats = await updatePropertyReviewStats(property.id);
    expect(stats.averageRating).toBe(4.5);
    expect(stats.totalReviews).toBe(2);

    updatedProp = await prisma.property.findUnique({ where: { id: property.id } });
    expect(updatedProp?.average_rating).toBe(4.5);
    expect(updatedProp?.total_reviews).toBe(2);
  });

  it("3. POST /api/properties/[id]/reviews memicu update otomatis pada kolom denormalisasi Property", async () => {
    const { property, user1, booking1 } = await createTestFixture();
    const token = await signUserToken({ userId: user1.id, email: user1.email, name: user1.name });
    mockCookiesStore.set("user_token", token);

    const req = new NextRequest(`http://localhost:3000/api/properties/${property.id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating: 5,
        comment: "Layanan sangat mantap!",
        booking_id: booking1.id,
      }),
    });

    const res = await reviewsPOST(req, { params: Promise.resolve({ id: property.id }) });
    expect(res.status).toBe(201);

    const updatedProp = await prisma.property.findUnique({ where: { id: property.id } });
    expect(updatedProp?.average_rating).toBe(5);
    expect(updatedProp?.total_reviews).toBe(1);
  });

  it("4. PATCH /api/admin/reviews/[id] (moderasi hide) memperbarui rating denormalisasi dan mengecualikan ulasan tersembunyi", async () => {
    const { property, user1, user2, booking1, booking2 } = await createTestFixture();

    // Buat dua review (rating 5 dan rating 1)
    await prisma.review.create({
      data: {
        property_id: property.id,
        user_id: user1.id,
        booking_id: booking1.id,
        rating: 5,
        comment: "Bagus",
      },
    });
    const badReview = await prisma.review.create({
      data: {
        property_id: property.id,
        user_id: user2.id,
        booking_id: booking2.id,
        rating: 1,
        comment: "Spam / Review kasar",
      },
    });

    await updatePropertyReviewStats(property.id);
    let prop = await prisma.property.findUnique({ where: { id: property.id } });
    expect(prop?.average_rating).toBe(3); // (5 + 1) / 2 = 3
    expect(prop?.total_reviews).toBe(2);

    // Admin menyembunyikan badReview
    const adminToken = process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
    const patchReq = new NextRequest(`http://localhost:3000/api/admin/reviews/${badReview.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_token=${adminToken}`,
      },
      body: JSON.stringify({ is_hidden: true }),
    });

    const patchRes = await adminReviewPATCH(patchReq, {
      params: Promise.resolve({ id: badReview.id }),
    });
    expect(patchRes.status).toBe(200);

    // Verifikasi rating di Property otomatis terupdate menjadi 5 dan total review 1
    prop = await prisma.property.findUnique({ where: { id: property.id } });
    expect(prop?.average_rating).toBe(5);
    expect(prop?.total_reviews).toBe(1);
  });

  it("5. query GET /api/properties membaca langsung average_rating dan total_reviews tanpa menyertakan objek relasi reviews", async () => {
    const { property } = await createTestFixture();

    // Set kolom denormalisasi
    await prisma.property.update({
      where: { id: property.id },
      data: {
        average_rating: 4.8,
        total_reviews: 25,
      },
    });

    const res = await propertiesGET(new Request("http://localhost:3000/api/properties"));
    expect(res.status).toBe(200);
    const body = await res.json();
    const item = body.data.find((p: { id: string }) => p.id === property.id);

    expect(item).toBeDefined();
    expect(item.average_rating).toBe(4.8);
    expect(item.total_reviews).toBe(25);

    // Verifikasi kode berkas src/app/api/properties/route.ts tidak memuat query reviews
    const routeCode = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/api/properties/route.ts"),
      "utf-8"
    );
    expect(routeCode).not.toContain("activeReviews.reduce");
    expect(routeCode).not.toContain("reviews: {\n        where: {\n          is_hidden: false,");
  });
});
