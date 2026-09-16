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
}));

import RegisterPage from "../src/app/register/page";

describe("Register Page UI (/register) - Issue #119", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/register/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender 5 input wajib form: Nama, No WhatsApp, Email, Password, dan Konfirmasi Password", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    // Judul & Badge
    expect(html).toContain("Daftar Akun Baru");
    expect(html).toContain("Pencari Kos &amp; Mahasiswa");

    // Input Nama Lengkap
    expect(html).toContain("Nama Lengkap");
    expect(html).toContain("register-name");
    expect(html).toContain('placeholder="Contoh: Budi Santoso"');

    // Input No WhatsApp
    expect(html).toContain("Nomor WhatsApp");
    expect(html).toContain("register-whatsapp");
    expect(html).toContain('type="tel"');
    expect(html).toContain('placeholder="0812xxxx..."');
    expect(html).toMatch(/maxlength="13"/i);

    // Input Email
    expect(html).toContain("Email");
    expect(html).toContain("register-email");
    expect(html).toContain('type="email"');

    // Input Password
    expect(html).toContain("register-password");
    expect(html).toContain('placeholder="Minimal 8 karakter"');

    // Input Konfirmasi Password
    expect(html).toContain("register-confirm-password");
    expect(html).toContain('placeholder="Ulangi password Anda"');
  });

  it("merender tombol submit pendaftaran dan tautan ke halaman login", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    // Tombol submit
    expect(html).toContain("Daftar Sekarang");
    expect(html).toContain('type="submit"');

    // Tautan login
    expect(html).toContain("Sudah punya akun?");
    expect(html).toContain("Masuk di sini");
    expect(html).toContain('href="/login"');
  });

  it("memiliki logika validasi client-side (cek kosong, format email, panjang password min 8, kecocokan password)", () => {
    const filePath = path.resolve(__dirname, "../src/app/register/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Cek Kosong
    expect(content).toContain("Nama lengkap wajib diisi.");
    expect(content).toContain("Nomor WhatsApp wajib diisi.");
    expect(content).toContain("Nomor WhatsApp tidak valid (minimal 10 digit).");
    expect(content).toContain("Alamat email wajib diisi.");

    // Cek Format WhatsApp & Email
    expect(content).toContain("replace(/\\D/g");
    expect(content).toContain("Format alamat email tidak valid.");
    expect(content).toMatch(/emailRegex/);

    // Cek Panjang Password
    expect(content).toContain("Password minimal terdiri dari 8 karakter.");
    expect(content).toContain("password.length < 8");

    // Cek Kecocokan Password
    expect(content).toContain("Konfirmasi password tidak cocok.");
    expect(content).toContain("password !== confirmPassword");
  });

  it("menerapkan atribut aksesibilitas dan styling responsif", () => {
    const filePath = path.resolve(__dirname, "../src/app/register/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("aria-invalid");
    expect(content).toContain("aria-describedby");
    expect(content).toContain("max-w-md");
    expect(content).toContain("rounded-2xl");
  });

  it("memiliki integrasi HTTP fetch ke endpoint /api/register dan penanganan error", () => {
    const filePath = path.resolve(__dirname, "../src/app/register/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/register"');
    expect(content).toContain('method: "POST"');
    expect(content).toContain("data?.error");
    expect(content).toContain("setIsSuccess(true)");
  });
});

