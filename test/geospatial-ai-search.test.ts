import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../src/app/api/ai-search/route";
import {
  geocodeLocation,
  calculateHaversineDistanceKm,
} from "../src/lib/geocoding";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

// Mock @google/genai
const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => {
  class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      NUMBER: "NUMBER",
      ARRAY: "ARRAY",
    },
  };
});

describe("Feature: AI Smart Search dengan Filter Jarak Radius Geospatial (Issue #192)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-gemini-key";
    await clearDatabase();
  });

  describe("Kriteria 1 & 4: Geocoding & Error Handling", () => {
    it("Query pencarian yang mengandung nama tempat berhasil dikonversi menjadi koordinat Latitude/Longitude", async () => {
      // Test dictionary geocoding
      const polsub = await geocodeLocation("Polsub Cibogo");
      expect(polsub).not.toBeNull();
      expect(polsub?.lat).toBeCloseTo(-6.5615, 2);
      expect(polsub?.lng).toBeCloseTo(107.8278, 2);

      const alunAlun = await geocodeLocation("Alun-alun Subang");
      expect(alunAlun).not.toBeNull();
      expect(alunAlun?.lat).toBeCloseTo(-6.5709, 2);
      expect(alunAlun?.lng).toBeCloseTo(107.7615, 2);
    });

    it("Error handling: Jika lokasi tidak ditemukan atau format aneh, memberikan fallback null secara anggun", async () => {
      // Mock global fetch to simulate failed geocoding without network
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

      const unknown = await geocodeLocation("Tempat antah berantah 123456xyz");
      expect(unknown).toBeNull();

      global.fetch = originalFetch;
    });

    it("Rumus Haversine menghitung jarak kilometer dengan presisi yang tepat", () => {
      // Alun-alun Subang ke Polsub Cibogo (~7.4 km)
      const dist = calculateHaversineDistanceKm(-6.57097, 107.76152, -6.56152, 107.82785);
      expect(dist).toBeGreaterThan(6.0);
      expect(dist).toBeLessThan(9.0);

      // Jarak ke titik yang sama adalah 0 km
      const zeroDist = calculateHaversineDistanceKm(-6.57097, 107.76152, -6.57097, 107.76152);
      expect(zeroDist).toBe(0);
    });
  });

  describe("Kriteria 2 & 3: Database Radius Filter (maksimal 10km) & Pipeline AI", () => {
    it("Database hanya mengembalikan kos dalam radius maksimal 10km dari koordinat tujuan", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Test Subang",
          whatsapp_number: "628999999999",
        },
      });

      // Titik Pusat Pencarian: Alun-alun Subang (-6.57097, 107.76152)

      // 1. Kos Dekat (Alun-alun, ~1 km) -> HARUS MASUK
      const kosDekat = await prisma.property.create({
        data: {
          name: "Kos Dekat Alun-alun",
          price_per_month: 800000,
          available_rooms: 2,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          latitude: -6.5650,
          longitude: 107.7600,
          owner_id: owner.id,
        },
      });

      // 2. Kos Sedang (Cibogo Polsub, ~7.5 km) -> HARUS MASUK (< 10km)
      const kosCibogo = await prisma.property.create({
        data: {
          name: "Kos Cibogo Polsub",
          price_per_month: 900000,
          available_rooms: 3,
          gender_type: "PUTRA",
          facilities: "WiFi, AC",
          latitude: -6.5615,
          longitude: 107.8278,
          owner_id: owner.id,
        },
      });

      // 3. Kos Jauh (Ciater / Tangkuban Perahu, ~20 km) -> TIDAK BOLEH MASUK (> 10km)
      await prisma.property.create({
        data: {
          name: "Kos Jauh di Ciater",
          price_per_month: 750000,
          available_rooms: 1,
          gender_type: "PUTRI",
          facilities: "WiFi",
          latitude: -6.7591,
          longitude: 107.6099,
          owner_id: owner.id,
        },
      });

      // Mock Gemini intent extraction untuk "Kos dekat Alun-alun Subang"
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          location_intent: "Alun-alun Subang",
          target_latitude: -6.57097,
          target_longitude: 107.76152,
          max_price: null,
          gender_type: null,
          facilities_keywords: [],
        }),
      });

      const req = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({ prompt: "Cari kos dekat Alun-alun Subang" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.properties).toBeDefined();

      const returnedIds = json.properties.map((p: { id: string }) => p.id);

      // Kos dekat (<10km) harus ada dalam hasil
      expect(returnedIds).toContain(kosDekat.id);
      expect(returnedIds).toContain(kosCibogo.id);

      // Kos jauh (>10km) TIDAK boleh masuk
      expect(returnedIds).not.toContain("Kos Jauh di Ciater");

      // Setiap kos yang dikembalikan harus memiliki distance_km <= 10
      for (const p of json.properties) {
        expect(p.distance_km).toBeLessThanOrEqual(10);
      }
    });

    it("AI hanya memproses dan merespons berdasarkan subset kos-kosan yang relevan secara jarak", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Budi",
          whatsapp_number: "628888888888",
        },
      });

      // Kos Putra dekat (< 10km)
      const kosPutraDekat = await prisma.property.create({
        data: {
          name: "Kos Putra Sekitar Polsub",
          price_per_month: 850000,
          available_rooms: 2,
          gender_type: "PUTRA",
          facilities: "AC, WiFi",
          latitude: -6.5620,
          longitude: 107.8270,
          owner_id: owner.id,
        },
      });

      // Kos Putri dekat (< 10km) - seharusnya disaring oleh semantik gender
      await prisma.property.create({
        data: {
          name: "Kos Putri Sekitar Polsub",
          price_per_month: 900000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          latitude: -6.5622,
          longitude: 107.8272,
          owner_id: owner.id,
        },
      });

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          location_intent: "Polsub Cibogo",
          target_latitude: -6.5615,
          target_longitude: 107.8278,
          max_price: 1000000,
          gender_type: "PUTRA",
          facilities_keywords: ["AC"],
        }),
      });

      const req = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({ prompt: "Cari kos putra dekat Kampus Polsub ada AC budget 1 juta" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      // Hanya kos putra dekat yang cocok kriteria
      const returnedIds = json.properties.map((p: { id: string }) => p.id);
      expect(returnedIds).toContain(kosPutraDekat.id);
      expect(json.properties[0].gender_type).toBe("PUTRA");
      expect(json.properties[0].distance_km).toBeLessThanOrEqual(10);
    });
  });

  describe("Kriteria 5: Pencarian Tanpa Lokasi Spesifik (Fallback)", () => {
    it("Jika user mencari tanpa menyebut lokasi spesifik, fungsi pencarian tetap berjalan normal ke seluruh data kos", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Nasional",
          whatsapp_number: "628777777777",
        },
      });

      const kosA = await prisma.property.create({
        data: {
          name: "Kos Murah Bandung",
          price_per_month: 600000,
          available_rooms: 3,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          latitude: -6.9175,
          longitude: 107.6191,
          owner_id: owner.id,
        },
      });

      const kosB = await prisma.property.create({
        data: {
          name: "Kos Murah Subang",
          price_per_month: 700000,
          available_rooms: 2,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          latitude: -6.5709,
          longitude: 107.7615,
          owner_id: owner.id,
        },
      });

      // User mencari "kos murah ada wifi" tanpa menyebut nama tempat
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          location_intent: null,
          target_latitude: null,
          target_longitude: null,
          max_price: 800000,
          gender_type: null,
          facilities_keywords: ["WiFi"],
        }),
      });

      const req = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({ prompt: "Cari kos murah ada wifi" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.location_intent).toBeNull();

      const returnedIds = json.properties.map((p: { id: string }) => p.id);
      expect(returnedIds).toContain(kosA.id);
      expect(returnedIds).toContain(kosB.id);
    });
  });
});
