import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/admin/owners/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/owners", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/owners", {
      headers: {
        cookie: "admin_token=kospasti_admin_authenticated",
      },
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak disertakan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/owners");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil seluruh daftar pemilik kos beserta jumlah properti dan diurutkan created_at desc", async () => {
      const owner1 = await prisma.owner.create({
        data: {
          name: "Ibu Sri Wahyuni",
          whatsapp_number: "081298765432",
          created_at: new Date("2026-01-01T10:00:00Z"),
        },
      });

      const owner2 = await prisma.owner.create({
        data: {
          name: "Pak Hendra Gunawan",
          whatsapp_number: "081234567890",
          created_at: new Date("2026-01-02T10:00:00Z"),
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Melati 1",
          price_per_month: 1000000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Melati 2",
          price_per_month: 1200000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "AC, WiFi, Kamar Mandi Dalam",
          owner_id: owner1.id,
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Sejahtera",
          price_per_month: 800000,
          available_rooms: 4,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          owner_id: owner2.id,
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Urutan desc berdasarkan created_at: Pak Hendra (owner2) lalu Ibu Sri (owner1)
      expect(result.data[0].id).toBe(owner2.id);
      expect(result.data[0].name).toBe("Pak Hendra Gunawan");
      expect(result.data[0].whatsapp_number).toBe("081234567890");
      expect(result.data[0]._count.properties).toBe(1);

      expect(result.data[1].id).toBe(owner1.id);
      expect(result.data[1].name).toBe("Ibu Sri Wahyuni");
      expect(result.data[1].whatsapp_number).toBe("081298765432");
      expect(result.data[1]._count.properties).toBe(2);
    });

    it("mengembalikan array kosong jika belum ada data pemilik kos", async () => {
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
      vi.spyOn(prisma.owner, "findMany").mockRejectedValueOnce(
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
