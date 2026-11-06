import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET } from "@/app/api/properties/route";
import { prisma } from "@/lib/prisma";
import { FacetedSearchFilter, POPULAR_FACILITIES } from "@/components/features/FacetedSearchFilter";

describe("Advanced Faceted Search & Facility Filtering (Issue #376)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Backend API /api/properties - Faceted Facilities Query", () => {
    const mockProperties = [
      {
        id: "prop-fac-1",
        name: "Kos Graha Mulia",
        price_per_month: 1200000,
        available_rooms: 4,
        gender_type: "CAMPUR",
        facilities: "AC, WiFi, Kamar Mandi Dalam, Parkir Mobil",
        is_pet_friendly: true,
        is_24_hours: true,
        status: "PUBLISHED",
        updated_at: new Date(),
        image_url: "/uploads/kos-graha.jpg",
        owner: { name: "Pak Slamet" },
        media: [],
        room_types: [],
        reviews: [],
      },
    ];

    it("Memfilter kos dengan fasilitas tunggal (facilities=AC)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=AC");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Pastikan Prisma findMany dipanggil dengan kondisi AND yang memuat AC
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PUBLISHED",
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    facilities: expect.objectContaining({
                      contains: "ac",
                      mode: "insensitive",
                    }),
                  }),
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it("Memfilter kombinasi multi-fasilitas (facilities=AC,Kamar Mandi Dalam)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=AC,Kamar%20Mandi%20Dalam");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const findManyCall = findManySpy.mock.calls[0][0] as any;
      const andConditions = findManyCall.where.AND;

      // Harus ada minimal 2 kondisi di AND (AC dan Kamar Mandi Dalam)
      expect(Array.isArray(andConditions)).toBe(true);
      expect(andConditions.length).toBeGreaterThanOrEqual(2);
    });

    it("Memfilter fasilitas Boolean khusus: Bebas Jam Malam (Akses 24 Jam)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=Bebas%20Jam%20Malam");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const findManyCall = findManySpy.mock.calls[0][0] as any;
      const andConditions = findManyCall.where.AND;

      // Kondisi harus memuat { is_24_hours: true }
      const has24HoursCondition = andConditions.some((cond: any) =>
        cond.OR?.some((orItem: any) => orItem.is_24_hours === true)
      );
      expect(has24HoursCondition).toBe(true);
    });

    it("Memfilter fasilitas Boolean khusus: Boleh Bawa Hewan (Pet Friendly)", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=Boleh%20Bawa%20Hewan");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const findManyCall = findManySpy.mock.calls[0][0] as any;
      const andConditions = findManyCall.where.AND;

      // Kondisi harus memuat { is_pet_friendly: true }
      const hasPetFriendlyCondition = andConditions.some((cond: any) =>
        cond.OR?.some((orItem: any) => orItem.is_pet_friendly === true)
      );
      expect(hasPetFriendlyCondition).toBe(true);
    });

    it("Memfilter fasilitas kelistrikan: Termasuk Listrik", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=Termasuk%20Listrik");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const findManyCall = findManySpy.mock.calls[0][0] as any;
      const andConditions = findManyCall.where.AND;

      const hasElectricityCondition = andConditions.some((cond: any) =>
        cond.OR?.some(
          (orItem: any) =>
            orItem.rental_terms?.contains === "listrik" ||
            orItem.facilities?.contains === "termasuk listrik"
        )
      );
      expect(hasElectricityCondition).toBe(true);
    });

    it("Memfilter fasilitas parkir: Parkir Mobil", async () => {
      const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue(mockProperties as any);
      vi.spyOn(prisma.property, "count").mockResolvedValue(1);

      const req = new Request("http://localhost:3000/api/properties?facilities=Parkir%20Mobil");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const findManyCall = findManySpy.mock.calls[0][0] as any;
      const andConditions = findManyCall.where.AND;

      const hasCarParkingCondition = andConditions.some((cond: any) =>
        cond.OR?.some((orItem: any) => orItem.facilities?.contains === "parkir mobil")
      );
      expect(hasCarParkingCondition).toBe(true);
    });
  });

  describe("2. UI Component FacetedSearchFilter", () => {
    it("Merender chip fasilitas populer utama dan judul filter", () => {
      const onChangeMock = vi.fn();
      const html = renderToStaticMarkup(
        <FacetedSearchFilter selectedFacilities={[]} onChange={onChangeMock} />
      );

      // Header filter
      expect(html).toContain("Filter Fasilitas Spesifik");
      expect(html).toContain("Pilih fasilitas yang wajib tersedia di kamar kos");

      // Chip populer
      expect(html).toContain("Kamar Mandi Dalam");
      expect(html).toContain("AC");
      expect(html).toContain("WiFi Cepat");
      expect(html).toContain("Parkir Mobil");
      expect(html).toContain("Bebas Jam Malam (24 Jam)");
      expect(html).toContain("Termasuk Listrik");
      expect(html).toContain("Boleh Bawa Hewan");
    });

    it("Menandai chip yang aktif (selected) dengan styling emerald dan status aria-pressed", () => {
      const onChangeMock = vi.fn();
      const html = renderToStaticMarkup(
        <FacetedSearchFilter
          selectedFacilities={["AC", "Kamar Mandi Dalam"]}
          onChange={onChangeMock}
        />
      );

      // Badge aktif
      expect(html).toContain("2 aktif");
      expect(html).toContain("Reset");

      // Styling terpilih
      expect(html).toContain("bg-emerald-600 text-white");
      expect(html).toContain('aria-pressed="true"');
    });

    it("Menyediakan tombol toggle untuk menampilkan seluruh opsi fasilitas", () => {
      const onChangeMock = vi.fn();
      const html = renderToStaticMarkup(
        <FacetedSearchFilter selectedFacilities={[]} onChange={onChangeMock} />
      );

      expect(html).toContain("fasilitas lainnya");
    });
  });
});
