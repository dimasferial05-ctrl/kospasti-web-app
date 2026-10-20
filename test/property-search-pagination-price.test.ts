import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/properties/route";
import { prisma } from "@/lib/prisma";

describe("Property Search Pagination & Room Types Price Filter (Issue #279)", () => {
  const mockProperties = [
    {
      id: "prop-1",
      name: "Kos Melati Subang",
      price_per_month: 1500000, // Harga dasar tinggi
      available_rooms: 5,
      gender_type: "CAMPUR",
      facilities: "WiFi, Kasur",
      status: "PUBLISHED",
      updated_at: new Date("2026-03-01T10:00:00Z"),
      image_url: "/uploads/properties/kos-melati.jpg",
      owner: { name: "Pak Slamet" },
      media: [],
      room_types: [
        { id: "rt-1", name: "Tipe Standar", price_per_month: 750000, available_rooms: 2 },
        { id: "rt-2", name: "Tipe Deluxe", price_per_month: 1500000, available_rooms: 3 },
      ],
      reviews: [{ rating: 4 }, { rating: 5 }],
    },
    {
      id: "prop-2",
      name: "Kos Mawar Indah",
      price_per_month: 600000,
      available_rooms: 2,
      gender_type: "PUTRI",
      facilities: "WiFi",
      status: "PUBLISHED",
      updated_at: new Date("2026-03-02T10:00:00Z"),
      image_url: "/uploads/properties/kos-mawar.jpg",
      owner: { name: "Ibu Nur" },
      media: [],
      room_types: [],
      reviews: [],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(prisma.property, "count").mockResolvedValue(50);
    vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as unknown as never);
  });

  describe("1. Validasi Paginasi Dinamis (take & skip)", () => {
    it("Menerapkan paginasi default (take: 24, skip: 0) dan mengembalikan metadata pagination", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany");
      const countSpy = vi.spyOn(prisma.property, "count");

      const req = new Request("http://localhost:3000/api/properties");
      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      // Verifikasi take: 24, skip: 0 dipanggil ke Prisma
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 24,
          skip: 0,
        })
      );
      expect(countSpy).toHaveBeenCalled();

      // Verifikasi metadata pagination
      expect(result.pagination).toEqual({
        page: 1,
        limit: 24,
        total: 50,
        total_pages: 3, // Math.ceil(50 / 24) = 3
      });
    });

    it("Menerapkan paginasi kustom (page=2, limit=10 -> skip: 10, take: 10)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany");

      const req = new Request("http://localhost:3000/api/properties?page=2&limit=10");
      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(200);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        })
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        total_pages: 5, // Math.ceil(50 / 10) = 5
      });
    });

    it("Membatasi limit maksimal ke 100 jika klien meminta limit berlebih (misal limit=500)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany");

      const req = new Request("http://localhost:3000/api/properties?limit=500");
      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(200);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
        })
      );
      expect(result.pagination.limit).toBe(100);
    });

    it("Menangani parameter page dan limit tidak valid secara aman dengan fallback", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany");

      const req = new Request("http://localhost:3000/api/properties?page=-3&limit=abc");
      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(200);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 24,
          skip: 0,
        })
      );
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(24);
    });
  });

  describe("2. Validasi Filter Harga Berdasarkan Tarif Tipe Kamar (room_types)", () => {
    it("Menggunakan klausa OR saat maxPrice diberikan agar menjangkau harga dasar ATAU harga kamar di room_types", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany");
      const countSpy = vi.spyOn(prisma.property, "count");

      const req = new Request("http://localhost:3000/api/properties?maxPrice=800000");
      const res = await GET(req);

      expect(res.status).toBe(200);

      const expectedWhere = expect.objectContaining({
        status: "PUBLISHED",
        OR: [
          { price_per_month: { lte: 800000 } },
          {
            room_types: {
              some: {
                price_per_month: { lte: 800000 },
              },
            },
          },
        ],
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );

      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );
    });

    it("Mengembalikan harga terendah dari room_types pada properti hasil mapping", async () => {
      const req = new Request("http://localhost:3000/api/properties");
      const res = await GET(req);
      const result = await res.json();

      const melati = result.data.find((p: { id: string }) => p.id === "prop-1");
      expect(melati).toBeDefined();
      // Harga dasar aslinya 1.500.000, tetapi memiliki tipe kamar seharga 750.000
      expect(melati.price_per_month).toBe(750000);
      expect(melati.average_rating).toBe(4.5);
    });
  });

  describe("3. Kompatibilitas Pemanggil Frontend (SearchPage & MapPage)", () => {
    it("Memastikan struktur JSON mengembalikan success: true dan array data", async () => {
      const req = new Request("http://localhost:3000/api/properties");
      const res = await GET(req);
      const result = await res.json();

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("data");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result).toHaveProperty("pagination");
    });
  });
});
