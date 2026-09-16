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

describe("User Login Page UI (/login) - Issue #120", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender judul, badge, input email, input password, dan tombol submit", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    // Header & Badge
    expect(html).toContain("Masuk ke Akun Anda");
    expect(html).toContain("Pencari Kos &amp; Mahasiswa");

    // Input Email
    expect(html).toContain("Email");
    expect(html).toContain("login-email");
    expect(html).toContain('type="email"');
    expect(html).toContain('placeholder="nama@email.com"');

    // Input Password
    expect(html).toContain("Password");
    expect(html).toContain("login-password");
    expect(html).toContain('placeholder="••••••••"');

    // Tombol Submit
    expect(html).toContain("Masuk");
    expect(html).toContain('type="submit"');
  });

  it("merender tautan navigasi ke halaman pendaftaran (register) dan beranda", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    // Tautan register
    expect(html).toContain("Belum punya akun?");
    expect(html).toContain("Daftar di sini");
    expect(html).toContain('href="/register"');

    // Tautan beranda
    expect(html).toContain("Kembali ke Beranda");
    expect(html).toContain('href="/"');
  });

  it("memiliki logika validasi client-side (cek kosong dan format email)", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Cek Kosong
    expect(content).toContain("Alamat email wajib diisi.");
    expect(content).toContain("Password wajib diisi.");

    // Cek Format Email
    expect(content).toContain("Format alamat email tidak valid.");
    expect(content).toMatch(/emailRegex/);
  });

  it("menerapkan atribut aksesibilitas dan styling responsif", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("aria-invalid");
    expect(content).toContain("aria-describedby");
    expect(content).toContain("max-w-md");
    expect(content).toContain("rounded-2xl");
  });

  it("memiliki integrasi HTTP fetch ke endpoint /api/login dan penanganan redirect callbackUrl", () => {
    const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/login"');
    expect(content).toContain('method: "POST"');
    expect(content).toContain("data?.error");
    expect(content).toContain("setIsSuccess(true)");
    expect(content).toContain("router.push(callbackUrl)");
    expect(content).toContain("useSearchParams");
  });
});

