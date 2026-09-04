import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/admin/bookings/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/bookings", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/bookings", {
      headers: {
        authorization: "Bearer 778899",
      },
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika header Authorization tidak disertakan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/bookings");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("mengembalikan status 401 Unauthorized jika token PIN salah", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/bookings", {
        headers: {
          authorization: "Bearer 000000",
        },
      });
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil seluruh riwayat booking beserta relasi nama properti diurutkan dari terbaru", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Ibu Siti",
          whatsapp_number: "081234567890",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Melati Indah",
          price_per_month: 850000,
          available_rooms: 3,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner.id,
        },
      });

      const booking1 = await prisma.booking.create({
        data: {
          student_name: "Budi Santoso",
          student_whatsapp: "081111111111",
          move_in_date: new Date("2026-10-01"),
          status: "PENDING",
          property_id: property.id,
          created_at: new Date("2026-09-01T10:00:00Z"),
        },
      });

      const booking2 = await prisma.booking.create({
        data: {
          student_name: "Siti Rahma",
          student_whatsapp: "082222222222",
          move_in_date: new Date("2026-10-05"),
          status: "SUCCESS",
          property_id: property.id,
          created_at: new Date("2026-09-02T10:00:00Z"),
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Urutan desc berdasarkan created_at (booking2 terbaru duluan)
      expect(result.data[0].id).toBe(booking2.id);
      expect(result.data[0].student_name).toBe("Siti Rahma");
      expect(result.data[0].student_whatsapp).toBe("082222222222");
      expect(result.data[0].status).toBe("SUCCESS");
      expect(result.data[0].property.name).toBe("Kos Melati Indah");

      expect(result.data[1].id).toBe(booking1.id);
      expect(result.data[1].student_name).toBe("Budi Santoso");
      expect(result.data[1].student_whatsapp).toBe("081111111111");
      expect(result.data[1].status).toBe("PENDING");
      expect(result.data[1].property.name).toBe("Kos Melati Indah");
    });

    it("mengembalikan array kosong jika belum ada data booking di database", async () => {
      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Skenario Gagal / Error Database", () => {
    it("mengembalikan status 500 jika terjadi kesalahan query database", async () => {
      vi.spyOn(prisma.booking, "findMany").mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection lost");
    });
  });
});
