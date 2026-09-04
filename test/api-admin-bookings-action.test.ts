import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "../src/app/api/admin/bookings/[id]/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("PATCH /api/admin/bookings/[id]", () => {
  const createAuthorizedRequest = (id: string, body: any) => {
    return new NextRequest(`http://localhost:3000/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: {
        authorization: "Bearer 778899",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika header Authorization tidak disertakan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/bookings/booking-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "SUCCESS" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "booking-1" }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("mengembalikan status 401 Unauthorized jika PIN token salah", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/bookings/booking-1", {
        method: "PATCH",
        headers: {
          authorization: "Bearer 123456",
        },
        body: JSON.stringify({ status: "SUCCESS" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "booking-1" }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Validasi Input", () => {
    it("mengembalikan status 400 jika status tidak disertakan dalam body", async () => {
      const request = createAuthorizedRequest("booking-1", {});
      const response = await PATCH(request, { params: Promise.resolve({ id: "booking-1" }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("status diperlukan");
    });

    it("mengembalikan status 400 jika status tidak valid", async () => {
      const request = createAuthorizedRequest("booking-1", { status: "INVALID_STATUS" });
      const response = await PATCH(request, { params: Promise.resolve({ id: "booking-1" }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("tidak valid");
    });
  });

  describe("Skenario Not Found", () => {
    it("mengembalikan status 404 jika booking ID tidak ditemukan", async () => {
      const request = createAuthorizedRequest("non-existent-id", { status: "SUCCESS" });
      const response = await PATCH(request, { params: Promise.resolve({ id: "non-existent-id" }) });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("tidak ditemukan");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil memperbarui status booking menjadi SUCCESS", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Ibu Nur",
          whatsapp_number: "081234567890",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Melati",
          price_per_month: 800000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "WiFi, Kasur",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          student_name: "Ahmad Fauzi",
          student_whatsapp: "081999888777",
          move_in_date: new Date("2026-10-01"),
          status: "PENDING",
          property_id: property.id,
        },
      });

      const request = createAuthorizedRequest(booking.id, { status: "SUCCESS" });
      const response = await PATCH(request, { params: Promise.resolve({ id: booking.id }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe("SUCCESS");
      expect(result.data.id).toBe(booking.id);

      const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(updated?.status).toBe("SUCCESS");
    });

    it("berhasil memperbarui status booking menjadi REJECTED", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Bambang",
          whatsapp_number: "081298765432",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Garuda",
          price_per_month: 1000000,
          available_rooms: 1,
          gender_type: "PUTRA",
          facilities: "AC",
          owner_id: owner.id,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          student_name: "Doni Pratama",
          student_whatsapp: "085555444333",
          move_in_date: new Date("2026-10-02"),
          status: "PENDING",
          property_id: property.id,
        },
      });

      const request = createAuthorizedRequest(booking.id, { status: "REJECTED" });
      const response = await PATCH(request, { params: Promise.resolve({ id: booking.id }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe("REJECTED");

      const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(updated?.status).toBe("REJECTED");
    });
  });

  describe("Skenario Error Database", () => {
    it("mengembalikan status 500 jika terjadi kesalahan query database", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockRejectedValueOnce(
        new Error("Database failure")
      );

      const request = createAuthorizedRequest("any-id", { status: "SUCCESS" });
      const response = await PATCH(request, { params: Promise.resolve({ id: "any-id" }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database failure");
    });
  });
});
