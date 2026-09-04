import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import PaymentSuccessPage from "../src/app/success/[bookingId]/page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ bookingId: "booking-success-uuid-456" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Payment Success Page Component (/success/[bookingId])", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/success/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender detail struk digital dengan ID Transaksi dinamis dan metode QRIS", () => {
    const html = renderToStaticMarkup(<PaymentSuccessPage />);

    // Header sukses
    expect(html).toContain("Pembayaran DP Berhasil!");

    // Digital Receipt fields
    expect(html).toContain("booking-success-uuid-456");
    expect(html).toContain("QRIS");
    expect(html).toContain("Hari Ini");
  });

  it("menampilkan pemberitahuan Escrow (Dana Anda Aman) dengan jelas", () => {
    const html = renderToStaticMarkup(<PaymentSuccessPage />);

    expect(html).toContain("Dana Anda Aman");
    expect(html).toContain("Sistem Escrow KosPasti menahan dana DP Anda");
    expect(html).toContain("SETELAH Anda tiba di lokasi dan melakukan check-in");
  });

  it("menggunakan ikon yang tepat dari lucide-react", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/success/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("CheckCircle2");
    expect(content).toContain("ShieldCheck");
    expect(content).toContain("lucide-react");
  });

  it("memiliki navigasi router.push('/') untuk kembali ke beranda", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/success/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("useRouter");
    expect(content).toContain("useParams");
    expect(content).toContain("router.push");
    expect(content).toContain("Kembali ke Beranda");
  });

  it("memiliki struktur layout centered card yang elegan", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/success/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("min-h-screen");
    expect(content).toContain("flex");
    expect(content).toContain("items-center");
    expect(content).toContain("justify-center");
    expect(content).toContain("rounded-2xl");
  });
});
