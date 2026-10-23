import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroSection } from "../src/components/landing/HeroSection";
import { RoleCardsSection } from "../src/components/landing/RoleCardsSection";
import LandingPage from "../src/app/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Landing Page Heading Hierarchy Accessibility (Issue #342)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("HeroSection menggunakan h2 untuk teks banner tanpa melompat langsung ke h3", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    // Memiliki h1 utama
    expect(html).toContain("<h1");
    expect(html).toContain("Temukan Kos Impian atau");

    // Memiliki h2 pada banner arsitektural (bukan h3)
    expect(html).toContain("<h2");
    expect(html).toContain("Ribuan Kamar Kos Siap Huni &amp; Terverifikasi");
    expect(html).toMatch(/<h2[^>]*>[\s\S]*?Ribuan Kamar Kos Siap Huni &amp; Terverifikasi[\s\S]*?<\/h2>/);
    expect(html).not.toMatch(/<h3[^>]*>[\s\S]*?Ribuan Kamar Kos Siap Huni &amp; Terverifikasi[\s\S]*?<\/h3>/);
  });

  it("RoleCardsSection menyertakan h2 dengan class sr-only sebelum kartu peran h3", () => {
    const html = renderToStaticMarkup(<RoleCardsSection />);

    // Memiliki h2 sr-only untuk pembaca layar
    expect(html).toContain('<h2 class="sr-only">Pilihan Peran Pengguna KosPasti</h2>');

    // Memiliki h3 untuk masing-masing kartu peran
    expect(html).toContain("<h3");
    expect(html).toContain("Saya Pencari Kos");
    expect(html).toContain("Saya Pemilik Kos");

    // Pastikan urutan: h2 sr-only muncul sebelum h3 peran
    const indexOfH2 = html.indexOf("Pilihan Peran Pengguna KosPasti");
    const indexOfH3Pencari = html.indexOf("Saya Pencari Kos");
    const indexOfH3Pemilik = html.indexOf("Saya Pemilik Kos");

    expect(indexOfH2).toBeGreaterThan(-1);
    expect(indexOfH3Pencari).toBeGreaterThan(indexOfH2);
    expect(indexOfH3Pemilik).toBeGreaterThan(indexOfH3Pencari);
  });

  it("LandingPage secara keseluruhan memiliki hirarki heading yang konsisten", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain("Temukan Kos Impian atau");
    expect(html).toContain("Ribuan Kamar Kos Siap Huni &amp; Terverifikasi");
    expect(html).toContain("Pilihan Peran Pengguna KosPasti");
    expect(html).toContain("Saya Pencari Kos");
    expect(html).toContain("Saya Pemilik Kos");
  });
});
