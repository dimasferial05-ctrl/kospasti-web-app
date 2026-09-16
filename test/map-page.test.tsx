import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/map",
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock @vis.gl/react-google-maps to avoid jsdom/browser canvas issues in unit test environment
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
  InfoWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-info-window">{children}</div>
  ),
  useMap: () => ({
    panTo: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn(() => 12),
  }),
}));

import MapSearchPage from "../src/app/map/page";
import MapViewer from "../src/components/MapViewer";

describe("Interactive Google Maps Property Search (/map) - Issue #121", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file page.tsx dan MapViewer.tsx", () => {
    const pagePath = path.resolve(__dirname, "../src/app/map/page.tsx");
    const mapViewerPath = path.resolve(__dirname, "../src/components/MapViewer.tsx");

    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const mapViewerContent = fs.readFileSync(mapViewerPath, "utf-8");

    expect(pageContent.trim().split("\n")[0].trim()).toMatch(/^["']use client["'];?$/);
    expect(mapViewerContent.trim().split("\n")[0].trim()).toMatch(/^["']use client["'];?$/);
  });

  it("merender judul halaman, input pencarian, filter gender, dan dropdown harga", () => {
    const html = renderToStaticMarkup(<MapSearchPage />);

    expect(html).toContain("Eksplorasi Kos Berdasarkan Lokasi");
    expect(html).toContain("Peta Interaktif Google Maps");
    expect(html).toContain("Cari nama kos, alamat, atau fasilitas...");
    expect(html).toContain("Semua Tipe");
    expect(html).toContain("Putra");
    expect(html).toContain("Putri");
    expect(html).toContain("Campur");
    expect(html).toContain("Semua Harga");
  });

  it("memiliki tombol toggle tampilan Peta dan Daftar untuk tampilan mobile", () => {
    const html = renderToStaticMarkup(<MapSearchPage />);

    expect(html).toContain("Peta");
    expect(html).toContain("Daftar");
  });

  it("MapViewer menampilkan fallback informatif jika Google Maps API key belum diset", () => {
    const sampleProperties = [
      {
        id: "kos-1",
        name: "Kos Nyaman Tebet",
        price_per_month: 850000,
        available_rooms: 2,
        gender_type: "PUTRA",
        facilities: "WiFi, AC",
        latitude: -6.23,
        longitude: 106.85,
      },
    ];

    const html = renderToStaticMarkup(
      <MapViewer properties={sampleProperties} apiKey="" />
    );

    expect(html).toContain("Google Maps API Key Belum Dikonfigurasi");
    expect(html).toContain("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  });

  it("MapViewer merender APIProvider dan Google Map dengan properti koordinat yang valid", () => {
    const sampleProperties = [
      {
        id: "kos-1",
        name: "Kos Mawar Tebet",
        price_per_month: 850000,
        available_rooms: 3,
        gender_type: "PUTRA",
        facilities: "WiFi, Kasur",
        latitude: -6.2374,
        longitude: 106.8526,
      },
      {
        id: "kos-2",
        name: "Kos Melati Grogol",
        price_per_month: 1250000,
        available_rooms: 0,
        gender_type: "PUTRI",
        facilities: "AC, WiFi",
        latitude: -6.1674,
        longitude: 106.7881,
      },
    ];

    const html = renderToStaticMarkup(
      <MapViewer
        properties={sampleProperties}
        apiKey="AIzaSyMockTestKey123"
      />
    );

    expect(html).toContain('data-testid="mock-api-provider"');
    expect(html).toContain('data-testid="mock-google-map"');
    expect(html).toContain("Rp 850rb");
    expect(html).toContain("Rp 1.3jt");
    expect(html).toContain("Penuh");
  });

  it("memiliki tracking attribution internal 'gmp_git_agentskills_v1' sesuai kepatuhan Google Maps Platform", () => {
    const mapViewerPath = path.resolve(__dirname, "../src/components/MapViewer.tsx");
    const content = fs.readFileSync(mapViewerPath, "utf-8");

    expect(content).toContain('internalUsageAttributionIds={["gmp_git_agentskills_v1"]}');
  });

  it("MapViewer mengimplementasikan ErrorBoundary untuk menangani runtime rendering error", () => {
    const mapViewerPath = path.resolve(__dirname, "../src/components/MapViewer.tsx");
    const content = fs.readFileSync(mapViewerPath, "utf-8");

    expect(content).toContain("MapErrorBoundary");
    expect(content).toContain("Gagal Memuat Peta Google Maps");
  });

  it("Header memuat tautan navigasi Peta Kos (/map)", () => {
    const headerPath = path.resolve(__dirname, "../src/components/shared/Header.tsx");
    const content = fs.readFileSync(headerPath, "utf-8");

    expect(content).toContain('href="/map"');
    expect(content).toContain("Peta Kos");
  });
});
