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
  useSearchParams: () => ({
    get: vi.fn((key: string) => (key === "callbackUrl" ? "/pesanan" : null)),
  }),
}));

import LoginPage from "../src/app/login/page";

describe("User Login Page UI (/login) - Google SSO Only", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender judul dan tombol utama Masuk dengan Google", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    // Header
    expect(html).toContain("Masuk ke KosPasti");

    // Tombol Google SSO
    expect(html).toContain("Lanjutkan dengan Google");
    expect(html).toContain("/api/auth/google?callbackUrl=%2Fpesanan");

    // Tidak ada input form manual
    expect(html).not.toContain('id="login-email"');
    expect(html).not.toContain('id="login-password"');
  });

  it("merender tautan navigasi ke portal mitra dan kembali ke beranda", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    // Tautan mitra
    expect(html).toContain("Pemilik Kos? Masuk ke Portal Mitra");
    expect(html).toContain('href="/partner/login"');

    // Tautan beranda
    expect(html).toContain("Kembali ke Beranda");
    expect(html).toContain('href="/"');
  });

  it("menerapkan styling responsif dan desain modern", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("max-w-md");
    expect(content).toContain("rounded-2xl");
    expect(content).toContain("shadow-soft-lg");
  });
});
