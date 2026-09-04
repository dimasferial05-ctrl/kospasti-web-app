import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/properties/[id]/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("GET /api/properties/[id]", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil detail properti beserta nomor WhatsApp owner dengan status 200", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Bapak Hidayat",
          whatsapp_number: "08123456789",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Mawar Putra",
          price_per_month: 500000,
          available_rooms: 2,
          gender_type: "PUTRA",
          facilities: "Fasilitas lengkap",
          image_url: "https://example.com/image.jpg",
          owner_id: owner.id,
        },
      });

      const request = new Request(`http://localhost/api/properties/${property.id}`);
      const response = await GET(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(property.id);
      expect(result.data.name).toBe("Kos Mawar Putra");
      expect(result.data.price_per_month).toBe(500000);
      expect(result.data.available_rooms).toBe(2);
      expect(result.data.gender_type).toBe("PUTRA");
      expect(result.data.facilities).toBe("Fasilitas lengkap");
      expect(result.data.image_url).toBe("https://example.com/image.jpg");
      expect(result.data.owner).toBeDefined();
      expect(result.data.owner.name).toBe("Bapak Hidayat");
      expect(result.data.owner.whatsapp_number).toBe("08123456789");
    });
  });

  describe("Skenario Tidak Ditemukan (404)", () => {
    it("mengembalikan status 404 ketika ID properti tidak ditemukan di database", async () => {
      const request = new Request("http://localhost/api/properties/id-asal-asalan");
      const response = await GET(request, {
        params: Promise.resolve({ id: "id-asal-asalan" }),
      });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Properti tidak ditemukan");
    });
  });

  describe("Skenario Error Server (500)", () => {
    it("mengembalikan status 500 ketika terjadi error pada database", async () => {
      vi.spyOn(prisma.property, "findUnique").mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const request = new Request("http://localhost/api/properties/some-id");
      const response = await GET(request, {
        params: Promise.resolve({ id: "some-id" }),
      });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Gagal mengambil detail properti");
    });
  });
});
