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

  it("memiliki struktur tabel Enterprise dengan header kolom lengkap dan tombol Tambah Properti", () => {
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

    // Tombol Tambah Properti
    expect(content).toContain("Tambah Properti");
    expect(content).toContain("handleOpenAddModal");

    // Header tabel
    expect(content).toContain("Nama Kos");
    expect(content).toContain("Nama Pemilik");
    expect(content).toContain("Tipe Kos");
    expect(content).toContain("Harga");
    expect(content).toContain("Kapasitas (Sisa)");
    expect(content).toContain("Aksi");
  });

  it("memiliki tombol Edit dan Copy Link pada setiap baris properti", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("handleOpenEditModal");
    expect(content).toContain("Edit");
    expect(content).toContain("handleCopyLink");
    expect(content).toContain("Copy Link");
  });

  it("memiliki komponen Modal Dialog Form dengan field lengkap untuk Tambah dan Edit Properti", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Modal state & elements
    expect(content).toContain("isModalOpen");
    expect(content).toContain("editingProperty");
    expect(content).toContain("Tambah Properti Kos Baru");
    expect(content).toContain("Edit Properti Kos");

    // Form inputs
    expect(content).toContain("Nama Kos");
    expect(content).toContain("Pemilik Kos (Owner)");
    expect(content).toContain("Harga / Bulan (Rp)");
    expect(content).toContain("Tipe Kos");
    expect(content).toContain("Jumlah Kamar Tersedia");
    expect(content).toContain("Fasilitas");
    expect(content).toContain("URL Gambar (Opsional)");

    // Options for gender_type
    expect(content).toContain('value="PUTRA"');
    expect(content).toContain('value="PUTRI"');
    expect(content).toContain('value="CAMPUR"');
  });

  it("memiliki input multi-upload media (gambar & video) dan FormData submit", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('type="file"');
    expect(content).toContain("multiple");
    expect(content).toContain("accept=");
    expect(content).toContain("handleFileChange");
    expect(content).toContain("new FormData()");
    expect(content).toContain("selectedFiles.forEach");
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

  it("memiliki fungsi handleSubmitForm untuk POST (create) dan PATCH (update) dengan memanggil endpoint API", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("handleSubmitForm");
    expect(content).toContain("/api/admin/properties/${editingProperty.id}");
    expect(content).toContain('"/api/admin/properties"');
    expect(content).toContain('method = isEdit ? "PATCH" : "POST"');
    expect(content).toContain("fetchProperties()");
  });

  it("mengambil data pemilik kos dari /api/admin/owners untuk mengisi dropdown pemilik kos", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/owners"');
    expect(content).toContain("fetchOwners");
    expect(content).toContain("owners.map");
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

  it("menangani status 401 Unauthorized dengan me-redirect pengguna ke /admin/login", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/properties/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("res.status === 401");
    expect(content).toContain('router.push("/admin/login")');
  });
});
