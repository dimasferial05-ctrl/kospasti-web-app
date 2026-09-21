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
    fitBounds: vi.fn(),
  }),
  useMapsLibrary: () => ({
    DirectionsService: vi.fn().mockImplementation(() => ({
      route: vi.fn(),
    })),
    DirectionsRenderer: vi.fn().mockImplementation(() => ({
      setMap: vi.fn(),
      setDirections: vi.fn(),
    })),
  }),
}));

import PropertyLocationMap from "../src/components/map/PropertyLocationMap";

describe("PropertyLocationMap Component - Issue #158 (Distance & Route Calculator)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file PropertyLocationMap.tsx", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/components/map/PropertyLocationMap.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender peta interaktif, pin lokasi kos, dan tombol cek rute ketika koordinat valid", () => {
    const html = renderToStaticMarkup(
      <PropertyLocationMap
        propertyName="Kos Mawar Indah"
        address="Jl. Kaliurang KM 5, Sleman, Yogyakarta"
        latitude={-7.7554}
        longitude={110.3789}
      />
    );

    expect(html).toContain("Lokasi &amp; Akses Sekitar");
    expect(html).toContain("Jl. Kaliurang KM 5, Sleman, Yogyakarta");
    expect(html).toContain("Cek Jarak &amp; Rute dari Lokasi Saya");
    expect(html).toContain("Petunjuk Arah");
    expect(html).toContain("Kos Mawar Indah");
    expect(html).toContain("mock-google-map");
  });

  it("merender fallback state ketika koordinat latitude atau longitude null/kosong", () => {
    const html = renderToStaticMarkup(
      <PropertyLocationMap
        propertyName="Kos Melati"
        address="Jl. Gejayan No. 10"
        latitude={null}
        longitude={null}
      />
    );

    expect(html).toContain("Titik Koordinat Peta Belum Tersedia");
    expect(html).toContain(
      "Pemilik kos belum mengatur titik koordinat peta untuk properti ini"
    );
    expect(html).toContain("Cari Alamat di Google Maps");
  });

  it("halaman detail kos (/kos/[id]) mengintegrasikan komponen PropertyLocationMap", () => {
    const pagePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    expect(content).toContain("PropertyLocationMap");
    expect(content).toContain("<PropertyLocationMap");
    expect(content).toContain("latitude={property.latitude}");
    expect(content).toContain("longitude={property.longitude}");
  });

  it("menghasilkan tautan Google Maps external navigation yang sesuai format koordinat", () => {
    const html = renderToStaticMarkup(
      <PropertyLocationMap
        propertyName="Kos Graha Asri"
        address="Jl. Gadjah Mada"
        latitude={-6.2}
        longitude={106.8}
      />
    );

    expect(html).toContain(
      "https://www.google.com/maps/dir/?api=1&amp;destination=-6.2,106.8"
    );
  });
});
