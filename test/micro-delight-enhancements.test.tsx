import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPropertyCardSkeleton } from "../src/components/features/MapPropertyCardSkeleton";
import MapSearchPage from "../src/app/map/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/search",
  useSearchParams: () => ({ get: vi.fn(() => null) }),
  useParams: () => ({ id: "prop-123" }),
}));

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
  InfoWindow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-info-window">{children}</div>
  ),
  useMap: () => ({ panTo: vi.fn(), setZoom: vi.fn(), getZoom: vi.fn(() => 12) }),
  useMapsLibrary: () => ({}),
}));

describe("Micro-Delight Enhancements Unit Tests - Issue #352", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memastikan PropertyLocationMap.tsx menyertakan language='id' dan region='ID'", () => {
    const filePath = path.resolve(__dirname, "../src/components/map/PropertyLocationMap.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('language="id"');
    expect(content).toContain('region="ID"');
  });

  it("merender tombol aksi nyata (Eksplor Lewat Peta & Segarkan Daftar) pada status kosong pencarian", () => {
    const filePath = path.resolve(__dirname, "../src/app/search/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Kos Tidak Ditemukan");
    expect(content).toContain("Eksplor Lewat Peta");
    expect(content).toContain("Segarkan Daftar");
    expect(content).toContain('href="/map"');
    expect(content).toContain("<MapPin");
    expect(content).toContain("window.location.reload()");
  });

  it("merender komponen MapPropertyCardSkeleton dengan animasi pulse dan thumbnail w-28 h-28", () => {
    const html = renderToStaticMarkup(<MapPropertyCardSkeleton />);

    expect(html).toContain("animate-pulse");
    expect(html).toContain("w-28");
    expect(html).toContain("h-28");
    expect(html).toContain("rounded-2xl");
  });

  it("merender 4 kartu skeleton shimmer pada MapSearchPage saat memuat data", () => {
    // Mock fetch pending agar tetap isLoading
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const html = renderToStaticMarkup(<MapSearchPage />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Memuat data kos...");
    const matches = html.match(/w-28 h-28/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThanOrEqual(4);
  });

  it("memverifikasi kode halaman detail kos memiliki tombol Share dengan Web Share dan fallback clipboard", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("handleShare");
    expect(content).toContain("navigator.share");
    expect(content).toContain("navigator.clipboard.writeText");
    expect(content).toContain("Tersalin!");
    expect(content).toContain("aria-label=\"Bagikan informasi kos\"");
  });
});
