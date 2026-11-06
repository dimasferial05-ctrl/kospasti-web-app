import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

import PaymentSuccessPage from "@/app/success/[bookingId]/page";
import BookingReceiptPage from "@/app/receipt/[bookingId]/page";
import robots from "@/app/robots";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ bookingId: "mock-booking-uuid-777" }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("E-Receipt Resmi & Voucher Booking Siap Cetak (#372)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Berkas Halaman Kuitansi (/receipt/[bookingId])", () => {
    it("memiliki direktif 'use client' di baris paling awal berkas", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/receipt/[bookingId]/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");
      const firstLine = content.trim().split("\n")[0].trim();
      expect(firstLine).toMatch(/^["']use client["'];?$/);
    });

    it("memuat komponen stempel digital LUNAS ESCROW DIJAMIN dan fungsi window.print", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/receipt/[bookingId]/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("digital-stamp");
      expect(content).toContain("LUNAS");
      expect(content).toContain("ESCROW DIJAMIN 12 JAM");
      expect(content).toContain("window.print()");
      expect(content).toContain("Cetak / Simpan PDF");
      expect(content).toContain("print:hidden");
      expect(content).toContain("QrCode");
    });

    it("memuat rincian lengkap penyewa, properti kos, kontak pemilik, dan instruksi serah terima kamar", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/receipt/[bookingId]/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Voucher Booking &amp; Bukti Pembayaran Resmi");
      expect(content).toContain("Data Penyewa (Mahasiswa)");
      expect(content).toContain("Data Properti Kos &amp; Kontak Pemilik");
      expect(content).toContain("Instruksi Serah Terima Kunci Kamar");
      expect(content).toContain("KP-INV-");
      expect(content).toContain("formatRupiah");
    });
  });

  describe("2. Tombol Kuitansi di Halaman Sukses (/success/[bookingId])", () => {
    it("merender tombol akses kuitansi resmi mengarah ke /receipt/[bookingId]", () => {
      const html = renderToStaticMarkup(<PaymentSuccessPage />);

      expect(html).toContain('href="/receipt/mock-booking-uuid-777"');
      expect(html).toContain("Lihat &amp; Cetak Kuitansi Resmi");
    });
  });

  describe("3. Tombol Kuitansi di Halaman Profil Pengguna (/profil)", () => {
    it("menyediakan tautan kuitansi resmi untuk pesanan yang telah lunas/disetujui", () => {
      const filePath = path.resolve(__dirname, "../src/app/profil/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('href={`/receipt/${booking.id}`}');
      expect(content).toContain("Kuitansi Resmi");
      expect(content).toContain("target=\"_blank\"");
    });
  });

  describe("4. Endpoint API Booking Detail (/api/bookings/[id])", () => {
    it("menyertakan relasi owner properti dan email user dalam query prisma", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/api/bookings/[id]/route.ts"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("owner:");
      expect(content).toContain("whatsapp_number: true");
      expect(content).toContain("studentEmail:");
    });
  });

  describe("5. Kepatuhan Keamanan & Robots (/robots.txt)", () => {
    it("memblokir perayapan publik bot pada halaman kuitansi transaksi (/receipt/)", () => {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;
      const disallowed = Array.isArray(rules.disallow)
        ? rules.disallow
        : [rules.disallow];

      expect(disallowed).toContain("/receipt/");
      expect(disallowed).toContain("/receipt/*");
    });
  });
});

