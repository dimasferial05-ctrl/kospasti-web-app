import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/properties/route";
import { prisma } from "@/lib/prisma";
import * as geospatial from "@/lib/propertyGeospatial";
import { Prisma } from "@prisma/client";

describe("Property Radius Search Distance-Based Pagination (Issue #305)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. mengurutkan dan memotong halaman berdasarkan jarak (kos terdekat tetap di halaman 1 meskipun updated_at lebih lama)", async () => {
    // 3 Properti dengan variasi jarak dan updated_at:
    // Prop A: Jarak 0.2 km, updated_at lama (2025-01-01)
    // Prop B: Jarak 0.8 km, updated_at sedang (2026-01-01)
    // Prop C: Jarak 5.0 km, updated_at paling baru (2026-03-01)
    const mockNearby = [
      { id: "prop-a", name: "Kos A (Dekat Sekali)", latitude: -6.2, longitude: 106.8, distance: 0.2 },
      { id: "prop-b", name: "Kos B (Dekat)", latitude: -6.21, longitude: 106.81, distance: 0.8 },
      { id: "prop-c", name: "Kos C (Jauh tapi Baru)", latitude: -6.25, longitude: 106.85, distance: 5.0 },
    ];

    vi.spyOn(geospatial, "findPropertiesWithinRadius").mockResolvedValue(mockNearby);

    // Mock query Prisma
    vi.spyOn(prisma.property, "findMany").mockImplementation(async (args?: Prisma.PropertyFindManyArgs) => {
      if (args?.select?.id) {
        return [{ id: "prop-a" }, { id: "prop-b" }, { id: "prop-c" }] as unknown as never;
      }
      // Return detail lengkap untuk pageIds yang diminta
      const inClause = args?.where?.id as { in?: string[] } | undefined;
      const requestedIds: string[] = inClause?.in || [];
      return requestedIds.map((id) => ({
        id,
        name: id === "prop-a" ? "Kos A" : id === "prop-b" ? "Kos B" : "Kos C",
        price_per_month: 1000000,
        available_rooms: 2,
        gender_type: "CAMPUR",
        facilities: "WiFi",
        status: "PUBLISHED",
        updated_at: id === "prop-c" ? new Date("2026-03-01") : new Date("2025-01-01"),
        owner: { name: "Owner" },
        media: [],
        room_types: [],
        reviews: [],
      })) as unknown as never;
    });

    // Uji Halaman 1 dengan limit=2: harus berisi Prop A (0.2km) dan Prop B (0.8km)
    const reqPage1 = new Request("http://localhost:3000/api/properties?lat=-6.2&lng=106.8&limit=2&page=1");
    const resPage1 = await GET(reqPage1);
    const dataPage1 = await resPage1.json();

    expect(resPage1.status).toBe(200);
    expect(dataPage1.success).toBe(true);
    expect(dataPage1.data).toHaveLength(2);
    expect(dataPage1.data[0].id).toBe("prop-a");
    expect(dataPage1.data[0].distance_km).toBe(0.2);
    expect(dataPage1.data[1].id).toBe("prop-b");
    expect(dataPage1.data[1].distance_km).toBe(0.8);
    expect(dataPage1.pagination.total).toBe(3);
    expect(dataPage1.pagination.total_pages).toBe(2);

    // Uji Halaman 2 dengan limit=2: harus berisi Prop C (5.0km)
    const reqPage2 = new Request("http://localhost:3000/api/properties?lat=-6.2&lng=106.8&limit=2&page=2");
    const resPage2 = await GET(reqPage2);
    const dataPage2 = await resPage2.json();

    expect(resPage2.status).toBe(200);
    expect(dataPage2.success).toBe(true);
    expect(dataPage2.data).toHaveLength(1);
    expect(dataPage2.data[0].id).toBe("prop-c");
    expect(dataPage2.data[0].distance_km).toBe(5.0);
  });

  it("2. mengembalikan array kosong dengan benar jika page melebihi total data", async () => {
    const mockNearby = [
      { id: "prop-a", name: "Kos A", latitude: -6.2, longitude: 106.8, distance: 0.2 },
    ];

    vi.spyOn(geospatial, "findPropertiesWithinRadius").mockResolvedValue(mockNearby);
    vi.spyOn(prisma.property, "findMany").mockImplementation(async (args?: Prisma.PropertyFindManyArgs) => {
      if (args?.select?.id) {
        return [{ id: "prop-a" }] as unknown as never;
      }
      return [] as unknown as never;
    });

    const req = new Request("http://localhost:3000/api/properties?lat=-6.2&lng=106.8&limit=10&page=5");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(0);
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.total_pages).toBe(1);
  });

  it("3. menggabungkan pencarian lokasi dengan filter tambahan secara akurat", async () => {
    const mockNearby = [
      { id: "prop-putra", name: "Kos Putra", latitude: -6.2, longitude: 106.8, distance: 0.3 },
      { id: "prop-putri", name: "Kos Putri", latitude: -6.21, longitude: 106.81, distance: 0.6 },
    ];

    vi.spyOn(geospatial, "findPropertiesWithinRadius").mockResolvedValue(mockNearby);

    // Mock Prisma hanya meloloskan prop-putri jika genderType=PUTRI
    vi.spyOn(prisma.property, "findMany").mockImplementation(async (args?: Prisma.PropertyFindManyArgs) => {
      if (args?.select?.id) {
        return [{ id: "prop-putri" }] as unknown as never;
      }
      return [
        {
          id: "prop-putri",
          name: "Kos Putri",
          price_per_month: 900000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "AC",
          status: "PUBLISHED",
          updated_at: new Date(),
          owner: { name: "Ibu Hj" },
          media: [],
          room_types: [],
          reviews: [],
        },
      ] as unknown as never;
    });

    const req = new Request("http://localhost:3000/api/properties?lat=-6.2&lng=106.8&genderType=PUTRI");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].id).toBe("prop-putri");
    expect(data.pagination.total).toBe(1);
  });

  it("4. pencarian umum tanpa koordinat tetap menggunakan orderBy updated_at desc", async () => {
    vi.spyOn(prisma.property, "count").mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.property, "findMany").mockResolvedValue([
      {
        id: "prop-regular",
        name: "Kos Reguler",
        price_per_month: 800000,
        available_rooms: 1,
        gender_type: "CAMPUR",
        facilities: "Kasur",
        status: "PUBLISHED",
        updated_at: new Date(),
        owner: { name: "Owner" },
        media: [],
        room_types: [],
        reviews: [],
      },
    ] as unknown as never);

    const req = new Request("http://localhost:3000/api/properties");
    const res = await GET(req);
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result.data).toHaveLength(1);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updated_at: "desc" },
      })
    );
  });
});
