import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import SyaratKetentuanPage, {
  metadata as syaratMetadata,
} from "@/app/syarat-ketentuan/page";
import KebijakanPrivasiPage, {
  metadata as privasiMetadata,
} from "@/app/kebijakan-privasi/page";
import KebijakanRefundPage, {
  metadata as refundMetadata,
} from "@/app/kebijakan-refund/page";
import { LegalNavTabs } from "@/components/legal/LegalNavTabs";
import { LandingFooter } from "@/components/landing/LandingFooter";
import CheckoutPage from "@/app/checkout/[bookingId]/page";
import { prisma } from "@/lib/prisma";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ bookingId: "test-booking-id-legal" }),
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/syarat-ketentuan",
}));

describe("Halaman Legalitas Resmi & Persetujuan Transaksi Checkout (#370)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Halaman Syarat & Ketentuan (/syarat-ketentuan)", () => {
    it("memiliki metadata yang informatif untuk mesin pencari & payment gateway", () => {
      expect(syaratMetadata.title).toContain("Syarat & Ketentuan");
      expect(syaratMetadata.title).toContain("KosPasti");
      expect(syaratMetadata.description).toBeDefined();
    });

    it("merender konten klausul lengkap: definisi, akun, DP, escrow 12 jam, dan kewajiban para pihak", () => {
      const html = renderToStaticMarkup(<SyaratKetentuanPage />);

      expect(html).toContain("Syarat &amp; Ketentuan Penggunaan");
      expect(html).toContain("Definisi Istilah");
      expect(html).toContain("Garansi Escrow 12 Jam");
      expect(html).toContain("Akun Pengguna &amp; Verifikasi Identitas");
      expect(html).toContain("Pemesanan &amp; Pembayaran Down Payment (DP)");
      expect(html).toContain("Kewajiban Penyewa");
      expect(html).toContain("Kewajiban Pemilik Kos");
      expect(html).toContain("Batasan Tanggung Jawab");
    });
  });

  describe("2. Halaman Kebijakan Privasi (/kebijakan-privasi)", () => {
    it("memiliki metadata kepatuhan perlindungan data", () => {
      expect(privasiMetadata.title).toContain("Kebijakan Privasi");
      expect(privasiMetadata.title).toContain("KosPasti");
      expect(privasiMetadata.description).toContain("UU PDP");
    });

    it("merender klausul kepatuhan UU PDP No. 27/2022, hak subjek data, dan enkripsi data", () => {
      const html = renderToStaticMarkup(<KebijakanPrivasiPage />);

      expect(html).toContain("Kebijakan Privasi &amp; Perlindungan Data");
      expect(html).toContain("UU PDP No. 27/2022");
      expect(html).toContain("Data Pribadi yang Kami Kumpulkan");
      expect(html).toContain("Tujuan Pemrosesan Data Pribadi");
      expect(html).toContain("Pengungkapan Data kepada Pihak Ketiga");
      expect(html).toContain("Keamanan, Penyimpanan, dan Enkripsi Data");
      expect(html).toContain("Hak Subjek Data Anda");
      expect(html).toContain("privacy@kospasti.id");
    });
  });

  describe("3. Halaman Kebijakan Refund & Escrow (/kebijakan-refund)", () => {
    it("memiliki metadata transparansi pengembalian dana sewa", () => {
      expect(refundMetadata.title).toContain("Kebijakan Refund");
      expect(refundMetadata.title).toContain("KosPasti");
      expect(refundMetadata.description).toBeDefined();
    });

    it("merender jaminan proteksi dana escrow 12 jam, kriteria full refund, serta persentase pembatalan", () => {
      const html = renderToStaticMarkup(<KebijakanRefundPage />);

      expect(html).toContain("Kebijakan Refund &amp; Pembatalan Sewa");
      expect(html).toContain("Garansi 100% Uang Kembali (Anti-Zonk Escrow 12 Jam)");
      expect(html).toContain("Kondisi Pengembalian Dana Penuh 100%");
      expect(html).toContain("Lebih dari 7 Hari Sebelum Tanggal Check-in");
      expect(html).toContain("Antara 3 sampai 7 Hari Sebelum Tanggal Check-in");
      expect(html).toContain("Kurang dari 3 Hari (72 Jam) Sebelum Tanggal Check-in");
      expect(html).toContain("Waktu Proses (SLA)");
      expect(html).toContain("1 hingga 3 hari kerja bank");
    });
  });

  describe("4. Komponen Tab Navigasi Legal (LegalNavTabs)", () => {
    it("menyediakan navigasi terpadu ke ketiga rute legal", () => {
      const html = renderToStaticMarkup(<LegalNavTabs />);

      expect(html).toContain('href="/syarat-ketentuan"');
      expect(html).toContain('href="/kebijakan-privasi"');
      expect(html).toContain('href="/kebijakan-refund"');
      expect(html).toContain("Syarat &amp; Ketentuan");
      expect(html).toContain("Kebijakan Privasi");
      expect(html).toContain("Kebijakan Refund &amp; Escrow");
    });
  });

  describe("5. Footer Navigasi (LandingFooter)", () => {
    it("mengarah ke rute legal mandiri bukan lagi query tab bantuan semata", () => {
      const html = renderToStaticMarkup(<LandingFooter />);

      expect(html).toContain('href="/syarat-ketentuan"');
      expect(html).toContain('href="/kebijakan-privasi"');
      expect(html).toContain('href="/kebijakan-refund"');
      expect(html).toContain("Syarat &amp; Ketentuan");
      expect(html).toContain("Kebijakan Privasi");
      expect(html).toContain("Kebijakan Refund &amp; Escrow");
    });
  });

  describe("6. SEO Robots & Sitemap Registration", () => {
    it("mengizinkan perayapan bot pada rute legal di robots.ts", () => {
      const robotsResult = robots();
      const rules = Array.isArray(robotsResult.rules)
        ? robotsResult.rules[0]
        : robotsResult.rules;
      const allowed = Array.isArray(rules.allow) ? rules.allow : [rules.allow];

      expect(allowed).toContain("/syarat-ketentuan");
      expect(allowed).toContain("/kebijakan-privasi");
      expect(allowed).toContain("/kebijakan-refund");
    });

    it("mendaftarkan ketiga rute legal ke dalam sitemap dinamis", async () => {
      vi.spyOn(prisma.property, "findMany").mockResolvedValue([] as never);
      vi.spyOn(prisma.location, "findMany").mockResolvedValue([] as never);

      const sitemapResult = await sitemap();
      const urls = sitemapResult.map((entry) => entry.url);

      expect(urls.some((u) => u.endsWith("/syarat-ketentuan"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/kebijakan-privasi"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/kebijakan-refund"))).toBe(true);
    });
  });

  describe("7. Checkbox Persetujuan Legalitas pada Halaman Checkout (/checkout/[bookingId])", () => {
    it("merender checkbox persetujuan dan tautan ke halaman legal terkait", () => {
      const html = renderToStaticMarkup(<CheckoutPage />);

      expect(html).toContain("terms-checkbox");
      expect(html).toContain('href="/syarat-ketentuan"');
      expect(html).toContain('href="/kebijakan-privasi"');
      expect(html).toContain('href="/kebijakan-refund"');
      expect(html).toContain("Saya telah membaca dan menyetujui");
    });

    it("memastikan tombol pembayaran secara default disabled jika checkbox belum dicentang", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/checkout/[bookingId]/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("isAgreedToTerms");
      expect(content).toContain("setIsAgreedToTerms");
      expect(content).toContain("disabled={isProcessing || !isAgreedToTerms}");
    });
  });
});

