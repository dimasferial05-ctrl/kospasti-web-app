import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

// Mock @vis.gl/react-google-maps
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-api-provider">{children}</div>
  ),
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-google-map">{children}</div>
  ),
  AdvancedMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-advanced-marker">{children}</div>
  ),
  useMap: () => ({
    panTo: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn(() => 15),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  }),
}));

import LocationPicker from "../src/components/map/LocationPicker";

describe("LocationPicker Component - Issue #210 (Interactive Map Location Picker)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "mock_key";
  });

  it("memiliki direktif 'use client' di baris paling awal file LocationPicker.tsx", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/components/map/LocationPicker.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender peta Google Maps, tombol 'Lokasi Saya Saat Ini', dan badge koordinat saat koordinat valid", () => {
    const html = renderToStaticMarkup(
      <LocationPicker
        latitude={-6.2088}
        longitude={106.8456}
        onChange={vi.fn()}
        label="Titik Koordinat Kos"
      />
    );

    expect(html).toContain("Titik Koordinat Kos");
    expect(html).toContain("Lokasi Saya Saat Ini");
    expect(html).toContain("mock-api-provider");
    expect(html).toContain("mock-google-map");
    expect(html).toContain("mock-advanced-marker");
    expect(html).toContain("-6.208800");
    expect(html).toContain("106.845600");
  });

  it("merender state belum ditentukan jika latitude atau longitude belum diisi", () => {
    const html = renderToStaticMarkup(
      <LocationPicker
        latitude={null}
        longitude={null}
        onChange={vi.fn()}
      />
    );

    expect(html).toContain("Belum ditentukan");
    expect(html).toContain("Lokasi Saya Saat Ini");
  });

  it("merender fallback UI ketika NEXT_PUBLIC_GOOGLE_MAPS_API_KEY tidak ada", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const html = renderToStaticMarkup(
      <LocationPicker
        latitude={null}
        longitude={null}
        onChange={vi.fn()}
        label="Peta Kos"
      />
    );

    expect(html).toContain("Peta interaktif tidak dapat dimuat");
  });
});
