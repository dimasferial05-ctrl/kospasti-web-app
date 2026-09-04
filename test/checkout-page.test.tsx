import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import CheckoutPage from "../src/app/checkout/[bookingId]/page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ bookingId: "booking-uuid-123" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Checkout Page Component (/checkout/[bookingId])", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/checkout/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender antarmuka QRIS checkout dan instruksi pembayaran", () => {
    const html = renderToStaticMarkup(<CheckoutPage />);

    // Header & Badge QRIS
    expect(html).toContain("QRIS");
    expect(html).toContain("Pembayaran DP Kos");
    expect(html).toContain("Gunakan aplikasi e-Wallet atau M-Banking Anda");

    // Booking Reference ID
    expect(html).toContain("booking-uuid-123");

    // Tombol simulasi
    expect(html).toContain("Simulasikan Pembayaran Berhasil");

    // Panduan Pembayaran
    expect(html).toContain("Panduan Pembayaran:");
    expect(html).toContain("Scan / Bayar QRIS");
  });

  it("memiliki ikon QR code besar di tengah tanpa gambar broken link", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/checkout/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Menggunakan ikon QrCode dari lucide-react, bukan <img> eksternal
    expect(content).toContain("QrCode");
    expect(content).toContain("lucide-react");
    expect(content).not.toContain("<img");
  });

  it("memiliki logika status loading (isProcessing) dan redirect ke /success/[bookingId]", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/checkout/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // State & Router setup
    expect(content).toContain("isProcessing");
    expect(content).toContain("setIsProcessing");
    expect(content).toContain("useRouter");
    expect(content).toContain("useParams");

    // Logika handleSimulatePayment
    expect(content).toContain("handleSimulatePayment");
    expect(content).toContain("setTimeout");
    expect(content).toContain("router.push(`/success/${bookingId}`)");

    // Tombol dinamis & disabled saat processing
    expect(content).toContain("disabled={isProcessing}");
    expect(content).toContain("Memproses...");
  });

  it("memiliki struktur styling yang rapi dan terpusat (centered card)", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/checkout/[bookingId]/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("min-h-screen");
    expect(content).toContain("flex");
    expect(content).toContain("items-center");
    expect(content).toContain("justify-center");
    expect(content).toContain("rounded-2xl");
  });
});
