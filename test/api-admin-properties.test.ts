import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/admin/properties/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/properties", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/properties", {
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
      const request = new NextRequest("http://localhost:3000/api/admin/properties");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("mengembalikan status 401 Unauthorized jika token PIN salah", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/properties", {
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
    it("berhasil mengambil seluruh properti beserta relasi owner (termasuk whatsapp_number) diurutkan berdasarkan nama saat terautentikasi", async () => {
      const owner1 = await prisma.owner.create({
        data: {
          name: "Ibu Rahayu",
          whatsapp_number: "081234567890",
        },
      });

      const owner2 = await prisma.owner.create({
        data: {
          name: "Pak Bambang",
          whatsapp_number: "089876543210",
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Bunga Melati",
          price_per_month: 900000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Anggrek Nyaman",
          price_per_month: 800000,
          available_rooms: 0,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          owner_id: owner2.id,
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Pastikan urutan berdasarkan nama 'asc' (Kos Anggrek Nyaman duluan daripada Kos Bunga Melati)
      expect(result.data[0].name).toBe("Kos Anggrek Nyaman");
      expect(result.data[0].owner.id).toBe(owner2.id);
      expect(result.data[0].owner.name).toBe("Pak Bambang");
      expect(result.data[0].owner.whatsapp_number).toBe("089876543210");
      expect(result.data[0].available_rooms).toBe(0);

      expect(result.data[1].name).toBe("Kos Bunga Melati");
      expect(result.data[1].owner.id).toBe(owner1.id);
      expect(result.data[1].owner.name).toBe("Ibu Rahayu");
      expect(result.data[1].owner.whatsapp_number).toBe("081234567890");
      expect(result.data[1].available_rooms).toBe(2);
    });

    it("mengembalikan array kosong jika belum ada data kos di database", async () => {
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
      vi.spyOn(prisma.property, "findMany").mockRejectedValueOnce(
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
