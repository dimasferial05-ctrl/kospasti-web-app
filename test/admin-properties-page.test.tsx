import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import ManagePropertiesPage from "../src/app/admin/properties/page";

describe("Manage Properties Page (/admin/properties)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender status loading pada saat inisialisasi", () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Pending promise untuk initial state
        })
    );

    const html = renderToStaticMarkup(<ManagePropertiesPage />);
    expect(html).toContain("Memuat data properti...");
  });

  it("memiliki struktur tabel Enterprise dengan header kolom lengkap", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Judul & Deskripsi
    expect(content).toContain("Daftar Kos &amp; Manajemen Link");
    expect(content).toContain(
      "Kelola properti terdaftar dan kirimkan magic link update kamar ke pemilik kos."
    );

    // Header tabel
    expect(content).toContain("Nama Kos");
    expect(content).toContain("Nama Pemilik");
    expect(content).toContain("Kapasitas (Sisa)");
    expect(content).toContain("Aksi");
  });

  it("memiliki logika badge ketersediaan kamar (hijau jika > 0, merah jika 0)", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("prop.available_rooms > 0");
    expect(content).toContain("bg-green-100 text-green-700");
    expect(content).toContain("bg-red-100 text-red-700");
    expect(content).toContain("Kamar");
  });

  it("memiliki fungsi handleCopyLink untuk memanggil API generate Magic Link dan menyalin ke clipboard dengan feedback 'Tersalin!'", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("handleCopyLink");
    expect(content).toContain("/api/magic-link/generate");
    expect(content).toContain("ownerId");
    expect(content).toContain("navigator.clipboard.writeText");
    expect(content).toContain("setCopiedId(propertyId)");
    expect(content).toContain("setCopiedId(null)");
    expect(content).toContain("Tersalin!");
    expect(content).toContain("Copy Link");
  });

  it("menampilkan pesan empty state saat tidak ada data kos", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("properties.length === 0");
    expect(content).toContain("Belum ada data kos.");
  });

  it("menyertakan header Authorization Bearer token saat memanggil API /api/admin/properties", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/properties"');
    expect(content).toContain('Authorization: "Bearer 778899"');
  });

  it("menyertakan header Authorization Bearer token saat memanggil API /api/magic-link/generate", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/magic-link/generate"');
    expect(content).toContain('Authorization: "Bearer 778899"');
  });
});
