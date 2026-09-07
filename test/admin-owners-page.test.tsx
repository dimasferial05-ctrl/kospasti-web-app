import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import AdminOwnersPage from "../src/app/admin/owners/page";

describe("Admin Owners Management Page (/admin/owners)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender status loading pada saat inisialisasi", () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Pending promise untuk initial loading
        })
    );

    const html = renderToStaticMarkup(<AdminOwnersPage />);
    expect(html).toContain("Memuat data pemilik kos...");
  });

  it("memiliki struktur tabel Enterprise dengan header kolom lengkap", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Judul & Deskripsi
    expect(content).toContain("Manajemen Pemilik Kos");
    expect(content).toContain(
      "Daftar seluruh pemilik kos (Ibu/Bapak Kos) yang terdaftar di platform KosPasti."
    );

    // Header tabel
    expect(content).toContain("Nama Pemilik");
    expect(content).toContain("Nomor WhatsApp");
    expect(content).toContain("Jumlah Properti");
    expect(content).toContain("Tanggal Terdaftar");
    expect(content).toContain("Aksi");
  });

  it("memiliki fitur pencarian (search bar) berdasarkan nama atau nomor WhatsApp", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Cari nama atau WhatsApp...");
    expect(content).toContain("searchQuery");
    expect(content).toContain("filteredOwners");
    expect(content).toContain("owner.name.toLowerCase().includes");
    expect(content).toContain("owner.whatsapp_number.toLowerCase().includes");
  });

  it("memiliki tombol chat WhatsApp langsung", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("https://wa.me/");
    expect(content).toContain("Chat WA");
  });

  it("menyertakan header Authorization Bearer token dari sessionStorage saat memanggil API /api/admin/owners dan menangani status 401", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/owners"');
    expect(content).toContain('sessionStorage.getItem("adminAuth")');
    expect(content).toContain("Authorization:");
    expect(content).toContain("Bearer ${token");
    expect(content).toContain("res.status === 401");
    expect(content).toContain('sessionStorage.removeItem("adminAuth")');
    expect(content).toContain('router.push("/admin")');
  });

  it("menampilkan empty state ketika data tidak ditemukan atau kosong", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("filteredOwners.length === 0");
    expect(content).toContain("Belum ada data pemilik kos terdaftar.");
  });
});
