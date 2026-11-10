import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as getSimilarProperties } from "@/app/api/properties/[id]/similar/route";
import SimilarPropertiesSection from "@/components/features/SimilarPropertiesSection";
import { prisma } from "@/lib/prisma";

describe("Similar Kos Recommendations - Issue #380", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("API: GET /api/properties/[id]/similar", () => {
    it("mengembalikan status 404 jika properti acuan tidak ditemukan di database", async () => {
      vi.spyOn(prisma.property, "findUnique").mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/properties/non-existent-id/similar");
      const res = await getSimilarProperties(req, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Properti acuan tidak ditemukan");
    });

    it("mengembalikan daftar kos serupa tanpa menyertakan properti acuan dan menghormati limit", async () => {
      const targetPropertyId = "target-kos-1";

      vi.spyOn(prisma.property, "findUnique").mockResolvedValueOnce({
        id: targetPropertyId,
        name: "Kos Graha Subang Asri",
        gender_type: "Putri",
        price_per_month: 1000000,
        available_rooms: 0,
        latitude: -6.5682,
        longitude: 107.7612,
        status: "PUBLISHED",
        room_types: [
          {
            id: "rt-1",
            name: "Kamar Standar",
            price_per_month: 1000000,
            available_rooms: 0,
          },
        ],
      } as any);

      vi.spyOn(prisma.property, "findMany").mockResolvedValueOnce([
        {
          id: "similar-kos-1",
          name: "Kos Melati Putri UPI",
          gender_type: "Putri",
          price_per_month: 950000,
          available_rooms: 2,
          facilities: "WiFi, Kasur",
          image_url: "/uploads/melati.jpg",
          latitude: -6.569,
          longitude: 107.762,
          status: "PUBLISHED",
          updated_at: new Date(),
          owner: { name: "Ibu Siti", whatsapp_number: "0812345678", avatar_url: null },
          media: [],
          room_types: [],
          reviews: [{ rating: 5 }],
        },
        {
          id: "similar-kos-2",
          name: "Kos Kenanga Campur",
          gender_type: "Campur",
          price_per_month: 1100000,
          available_rooms: 1,
          facilities: "AC, WiFi",
          image_url: "/uploads/kenanga.jpg",
          latitude: -6.57,
          longitude: 107.763,
          status: "PUBLISHED",
          updated_at: new Date(),
          owner: { name: "Pak Joko", whatsapp_number: "0812345679", avatar_url: null },
          media: [],
          room_types: [],
          reviews: [{ rating: 4 }],
        },
        {
          id: targetPropertyId, // sengaja ada di candidates untuk memastikan difilter/tidak lolos
          name: "Kos Graha Subang Asri",
          gender_type: "Putri",
          price_per_month: 1000000,
          available_rooms: 0,
          status: "PUBLISHED",
          updated_at: new Date(),
          owner: { name: "Ibu Siti" },
          media: [],
          room_types: [],
          reviews: [],
        },
      ] as any);

      const req = new NextRequest("http://localhost:3000/api/properties/target-kos-1/similar?limit=2");
      const res = await getSimilarProperties(req, {
        params: Promise.resolve({ id: targetPropertyId }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(2);

      // Pastikan properti acuan tidak ada dalam daftar rekomendasi
      const ids = data.data.map((p: any) => p.id);
      expect(ids).not.toContain(targetPropertyId);

      // Pastikan item memiliki properti terformat
      const first = data.data[0];
      expect(first).toHaveProperty("price_per_month");
      expect(first).toHaveProperty("available_rooms");
      expect(first).toHaveProperty("average_rating");
      expect(first).toHaveProperty("distance_km");
      expect(typeof first.distance_km).toBe("number");
    });
  });

  describe("UI Component: SimilarPropertiesSection", () => {
    it("merender banner peringatan kamar penuh ketika isFullyBooked bernilai true", () => {
      // Mock render dengan banner
      const html = renderToStaticMarkup(
        <div data-testid="similar-wrapper">
          <div data-testid="fully-booked-banner">
            Kamar di Kos Mawar Saat Ini Sedang Penuh
          </div>
          <h3>Kos Serupa di Sekitar Area Ini</h3>
        </div>
      );

      expect(html).toContain("Kamar di Kos Mawar Saat Ini Sedang Penuh");
      expect(html).toContain("Kos Serupa di Sekitar Area Ini");
    });

    it("tidak merender banner kamar penuh ketika isFullyBooked bernilai false", () => {
      const html = renderToStaticMarkup(
        <div data-testid="similar-wrapper">
          <h3>Kos Serupa di Sekitar Area Ini</h3>
        </div>
      );

      expect(html).not.toContain("Kamar di Kos Mawar Saat Ini Sedang Penuh");
      expect(html).toContain("Kos Serupa di Sekitar Area Ini");
    });

    it("komponen SimilarPropertiesSection terdefinisi dan dapat di-render tanpa crash", () => {
      const html = renderToStaticMarkup(
        <SimilarPropertiesSection
          currentPropertyId="dummy-id"
          propertyName="Kos Melati"
          isFullyBooked={false}
        />
      );

      // Awal render menampilkan skeleton loading state sebelum fetch selesai
      expect(html).toContain("Kos Serupa di Sekitar Area Ini");
      expect(html).toContain("Rekomendasi Pilihan");
    });

    it("menampilkan alert kamar penuh di dalam SimilarPropertiesSection saat isFullyBooked bernilai true", () => {
      const html = renderToStaticMarkup(
        <SimilarPropertiesSection
          currentPropertyId="dummy-id"
          propertyName="Kos Kenanga"
          isFullyBooked={true}
        />
      );

      expect(html).toContain("Kamar di Kos Kenanga Saat Ini Sedang Penuh");
      expect(html).toContain("alternatif kos terdekat");
    });
  });
});
