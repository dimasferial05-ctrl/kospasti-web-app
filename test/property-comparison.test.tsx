import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as getCompareProperties } from "@/app/api/properties/compare/route";
import CompareButton from "@/components/features/CompareButton";
import CompareFloatingBar from "@/components/features/CompareFloatingBar";
import ComparePage from "@/app/compare/page";
import { prisma } from "@/lib/prisma";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("ids=kos-1,kos-2"),
}));

// In-Memory LocalStorage Mock
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();

if (typeof globalThis.window === "undefined") {
  (globalThis as any).window = {
    localStorage: mockStorage,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    Event: class {
      constructor(public type: string) {}
    },
  };
}

describe("Side-by-Side Property Comparison - Issue #382", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage.clear();
  });

  describe("API: GET /api/properties/compare", () => {
    it("mengembalikan status 400 jika parameter ids tidak disediakan atau kosong", async () => {
      const req = new NextRequest("http://localhost:3000/api/properties/compare");
      const res = await getCompareProperties(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Parameter ids diperlukan");
    });

    it("mengembalikan data komparasi terstruktur maksimal 3 kos", async () => {
      vi.spyOn(prisma.property, "findMany").mockResolvedValueOnce([
        {
          id: "kos-1",
          name: "Kos Graha Subang Asri",
          gender_type: "Putri",
          price_per_month: 1000000,
          available_rooms: 2,
          facilities: "Kamar Mandi Dalam, AC, WiFi, Kasur, Lemari, Parkir Motor",
          rules: "Dilarang merokok, Tamu pria dilarang masuk",
          rental_terms: "Termasuk listrik, Minimal sewa 1 bulan",
          is_24_hours: true,
          is_pet_friendly: false,
          image_url: "/uploads/kos-1.jpg",
          address: "Jl. RA Kartini No. 12, Subang",
          latitude: -6.568,
          longitude: 107.761,
          status: "PUBLISHED",
          owner: { name: "Ibu Hj. Siti", whatsapp_number: "0812345678", avatar_url: null },
          media: [],
          room_types: [
            {
              id: "rt-1",
              name: "Standar AC",
              price_per_month: 1000000,
              available_rooms: 2,
              facilities: "AC, WiFi",
              image_url: null,
            },
          ],
          reviews: [{ rating: 5 }, { rating: 4 }],
        },
        {
          id: "kos-2",
          name: "Kos Sukamaju Campur",
          gender_type: "Campur",
          price_per_month: 750000,
          available_rooms: 0,
          facilities: "Kamar Mandi Luar, Kipas Angin, Parkir Motor, Dapur Bersama",
          rules: "Pintu gerbang ditutup jam 23.00",
          rental_terms: "Token listrik mandiri",
          is_24_hours: false,
          is_pet_friendly: true,
          image_url: null,
          address: "Jl. Otista No. 45, Subang",
          latitude: -6.57,
          longitude: 107.763,
          status: "PUBLISHED",
          owner: { name: "Pak Joko", whatsapp_number: "0812345679", avatar_url: null },
          media: [],
          room_types: [],
          reviews: [{ rating: 4 }],
        },
      ] as any);

      const req = new NextRequest(
        "http://localhost:3000/api/properties/compare?ids=kos-1,kos-2,kos-3,kos-4"
      );
      const res = await getCompareProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);

      const kos1 = data.data[0];
      expect(kos1.name).toBe("Kos Graha Subang Asri");
      expect(kos1.average_rating).toBe(4.5);
      expect(kos1.total_reviews).toBe(2);
      expect(kos1.structured_features.has_ac).toBe(true);
      expect(kos1.structured_features.has_private_bathroom).toBe(true);
      expect(kos1.structured_features.has_wifi).toBe(true);
      expect(kos1.structured_features.is_electricity_included).toBe(true);
      expect(kos1.structured_features.has_curfew).toBe(false);

      const kos2 = data.data[1];
      expect(kos2.name).toBe("Kos Sukamaju Campur");
      expect(kos2.available_rooms).toBe(0);
      expect(kos2.structured_features.has_ac).toBe(false);
      expect(kos2.structured_features.has_private_bathroom).toBe(false);
      expect(kos2.structured_features.is_electricity_included).toBe(false);
      expect(kos2.structured_features.has_curfew).toBe(true);
      expect(kos2.is_pet_friendly).toBe(true);
    });

    it("menangani edge-case parsing: 'belum termasuk listrik', 'cermin kaca', dan 'cuci piring'", async () => {
      vi.spyOn(prisma.property, "findMany").mockResolvedValueOnce([
        {
          id: "kos-edge-case",
          name: "Kos Anggrek Subang",
          gender_type: "Putri",
          price_per_month: 800000,
          available_rooms: 1,
          facilities: "Kasur, Lemari, Cermin Kaca, Tempat Cuci Piring",
          rules: "Dilarang berisik",
          rental_terms: "Harga sewa belum termasuk listrik bulanan",
          is_24_hours: true,
          is_pet_friendly: false,
          image_url: null,
          address: "Dekat STIESA Subang",
          latitude: -6.565,
          longitude: 107.766,
          status: "PUBLISHED",
          owner: { name: "Ibu Nur", whatsapp_number: "0812345670", avatar_url: null },
          media: [],
          room_types: [],
          reviews: [],
        },
      ] as any);

      const req = new NextRequest(
        "http://localhost:3000/api/properties/compare?ids=kos-edge-case"
      );
      const res = await getCompareProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const kos = data.data[0];

      // Verifikasi false positive dicegah:
      expect(kos.structured_features.is_electricity_included).toBe(false); // Dari "belum termasuk listrik"
      expect(kos.structured_features.has_ac).toBe(false); // Dari "Cermin Kaca"
      expect(kos.structured_features.has_laundry).toBe(false); // Dari "Cuci Piring"
      expect(kos.structured_features.has_bed).toBe(true); // Dari "Kasur"

      // Verifikasi pengenalan kampus / sekolah tinggi Subang (STIESA)
      expect(kos.nearest_campus).toBeDefined();
      expect(kos.nearest_campus?.name).toContain("STIESA SUBANG");
    });
  });

  describe("UI Components: CompareButton & CompareFloatingBar", () => {
    it("merender CompareButton varian icon pada kartu kos tanpa crash", () => {
      const html = renderToStaticMarkup(
        <CompareButton
          property={{
            id: "kos-test-1",
            name: "Kos Melati",
            price: 850000,
            gender_type: "Putri",
          }}
          variant="icon"
          size="sm"
        />
      );

      expect(html).toContain("Bandingkan kos Kos Melati");
    });

    it("merender CompareButton varian button dengan teks lengkap", () => {
      const html = renderToStaticMarkup(
        <CompareButton
          property={{
            id: "kos-test-1",
            name: "Kos Kenanga",
            price: 1200000,
            gender_type: "Campur",
          }}
          variant="button"
        />
      );

      expect(html).toContain("Bandingkan");
      expect(html).toContain("Kos Kenanga");
    });

    it("CompareFloatingBar terdefinisi dan dapat di-render tanpa crash", () => {
      const html = renderToStaticMarkup(<CompareFloatingBar />);
      // Saat awal SSR tanpa state tersimpan, floating bar mengembalikan null
      expect(html).toBe("");
    });

    it("ComparePage terdefinisi dan dapat di-render tanpa crash (menampilkan struktur awal atau loading)", () => {
      const html = renderToStaticMarkup(<ComparePage />);
      expect(html).toContain("Memuat");
    });
  });
});
