import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/ai-search/route";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MapViewer from "../src/components/MapViewer";

// Mock @vis.gl/react-google-maps
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-api-provider">{children}</div>
  ),
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-google-map">{children}</div>
  ),
  AdvancedMarker: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="mock-advanced-marker" title={title}>{children}</div>
  ),
  InfoWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-info-window">{children}</div>
  ),
  useMap: () => ({
    panTo: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn(() => 12),
  }),
}));

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

describe("AI Natural Language Search Feature (Issue #144)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe("API Route: /api/ai-search", () => {
    it("mengembalikan status 400 jika prompt kosong atau tidak valid", async () => {
      const req1 = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({ prompt: "" }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(400);

      const json1 = await res1.json();
      expect(json1.success).toBe(false);
      expect(json1.error).toContain("tidak boleh kosong");
    });

    it("mengembalikan status 500 jika GEMINI_API_KEY tidak dikonfigurasi", async () => {
      delete process.env.GEMINI_API_KEY;

      const req = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({ prompt: "Kos putri dekat UI" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("GEMINI_API_KEY");
    });

    it("mengekstrak kriteria pencarian terstruktur menggunakan Gemini API saat request valid", async () => {
      process.env.GEMINI_API_KEY = "mock-gemini-key";

      const mockResponse = {
        location_intent: "Universitas Indonesia",
        max_price: 2000000,
        gender_type: "PUTRI",
        facilities_keywords: ["AC", "WiFi"],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const req = new Request("http://localhost/api/ai-search", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Kos putri dekat UI budget 2 juta fasilitas AC dan WiFi",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.location_intent).toBe("Universitas Indonesia");
      expect(json.data.max_price).toBe(2000000);
      expect(json.data.gender_type).toBe("PUTRI");
      expect(json.data.facilities_keywords).toEqual(["AC", "WiFi"]);
    });
  });

  describe("UI & MapViewer Integration with Search Target", () => {
    it("MapViewer merender target pencarian lokasi jika searchTarget diberikan", () => {
      const sampleProperties = [
        {
          id: "kos-1",
          name: "Kos Putri Melati",
          price_per_month: 1500000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          latitude: -6.365,
          longitude: 106.831,
          distance_km: 0.8,
        },
      ];

      const searchTarget = {
        lat: -6.362,
        lng: 106.828,
        name: "Universitas Indonesia",
      };

      const html = renderToStaticMarkup(
        <MapViewer
          properties={sampleProperties}
          apiKey="AIzaSyMockTestKey123"
          searchTarget={searchTarget}
        />
      );

      expect(html).toContain("Universitas Indonesia");
      expect(html).toContain('title="Target Pencarian: Universitas Indonesia"');
    });
  });
});
