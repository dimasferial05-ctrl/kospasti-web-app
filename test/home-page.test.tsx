import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage from "../src/app/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Landing Page Component (/) - Issue #168 Revamp", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("merender Landing Page secara lengkap dengan seluruh seksi utama sesuai layout referensi", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    // 1. Hero Section
    expect(html).toContain("Temukan Kos Impian atau");
    expect(html).toContain("Kelola Propertimu?");
    expect(html).toContain("Cari Kos");

    // 2. Role Cards Section
    expect(html).toContain("Saya Pencari Kos");
    expect(html).toContain("Saya Pemilik Kos");
    expect(html).toContain("Cari Kos Sekarang");
    expect(html).toContain("Pelajari Kemitraan Mitra");

    // 3. How It Works Section
    expect(html).toContain("KosPasti mempermudah proses sewa kos hanya dalam 3 langkah mudah:");
    expect(html).toContain("Cari Kos &amp; Filter Kebutuhan");
    expect(html).toContain("Tanya Pemilik &amp; Cek Ulasan");
    expect(html).toContain("Booking &amp; Bayar dengan Escrow");

    // 4. Features Section (Editorial)
    expect(html).toContain("Ulasan Asli dari Penghuni, Transparansi Tanpa Rekayasa");
    expect(html).toContain("Pencarian Berbasis AI &amp; Otomasi Notifikasi WhatsApp");

    // 5. Partner CTA Section (B2B)
    expect(html).toContain("Punya Properti Kos? Kelola Cerdas &amp; Maksimalkan Okupansi");
    expect(html).toContain("Daftar Sebagai Mitra Kos");
    expect(html).toContain('id="mitra"');

    // 6. FAQ Section
    expect(html).toContain("Pertanyaan yang Sering Diajukan (FAQ)");
    expect(html).toContain('id="faq"');
    expect(html).toContain("Bagaimana sistem pembayaran aman (Escrow)");

    // 7. Modern Footer
    expect(html).toContain("KosPasti");
    expect(html).toContain("Kepastian Kos Real-Time");
    expect(html).toContain("All rights reserved");
  });

  it("memiliki struktur komponen modular yang terorganisir di src/components/landing/", () => {
    const landingDir = path.resolve(__dirname, "../src/components/landing");
    expect(fs.existsSync(landingDir)).toBe(true);

    const expectedFiles = [
      "HeroSection.tsx",
      "RoleCardsSection.tsx",
      "HowItWorksSection.tsx",
      "FeaturesSection.tsx",
      "PartnerCTASection.tsx",
      "FAQSection.tsx",
      "LandingFooter.tsx",
      "index.ts",
    ];

    expectedFiles.forEach((file) => {
      const filePath = path.join(landingDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it("mengarahkan CTA pencarian ke /search dan CTA mitra ke id #mitra", () => {
    const roleCardPath = path.resolve(__dirname, "../src/components/landing/RoleCardsSection.tsx");
    const content = fs.readFileSync(roleCardPath, "utf-8");

    expect(content).toContain('href="/search"');
    expect(content).toContain('href="#mitra"');
  });
});
