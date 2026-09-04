import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/admin/stats/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/stats", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/stats", {
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
      const request = new NextRequest("http://localhost:3000/api/admin/stats");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("mengembalikan status 401 Unauthorized jika token PIN salah", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats", {
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
    it("berhasil menghitung total properti, total kamar tersedia, dan total booking secara akurat", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Ibu Nurul",
          whatsapp_number: "081234567890",
        },
      });

      const prop1 = await prisma.property.create({
        data: {
          name: "Kos Melati",
          price_per_month: 800000,
          available_rooms: 4,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner.id,
        },
      });

      const prop2 = await prisma.property.create({
        data: {
          name: "Kos Mawar",
          price_per_month: 900000,
          available_rooms: 2,
          gender_type: "PUTRA",
          facilities: "Kasur",
          owner_id: owner.id,
        },
      });

      await prisma.booking.create({
        data: {
          student_name: "Ahmad",
          student_whatsapp: "081111111111",
          move_in_date: new Date("2026-10-01"),
          status: "PENDING",
          property_id: prop1.id,
        },
      });

      await prisma.booking.create({
        data: {
          student_name: "Budi",
          student_whatsapp: "082222222222",
          move_in_date: new Date("2026-10-05"),
          status: "SUCCESS",
          property_id: prop2.id,
        },
      });

      await prisma.booking.create({
        data: {
          student_name: "Citra",
          student_whatsapp: "083333333333",
          move_in_date: new Date("2026-10-10"),
          status: "SUCCESS",
          property_id: prop1.id,
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.properties).toBe(2);
      expect(result.data.rooms).toBe(6); // 4 + 2
      expect(result.data.bookings).toBe(3);
    });

    it("mengembalikan nilai 0 untuk semua metrik jika database masih kosong", async () => {
      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.properties).toBe(0);
      expect(result.data.rooms).toBe(0);
      expect(result.data.bookings).toBe(0);
    });
  });

  describe("Skenario Gagal / Error Database", () => {
    it("mengembalikan status 500 jika terjadi kesalahan pada Prisma count atau aggregate", async () => {
      vi.spyOn(prisma.property, "count").mockRejectedValueOnce(
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
