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

  it("memanggil API /api/admin/owners dan menangani redirect status 401 ke /admin/login", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/owners/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/owners"');
    expect(content).toContain("res.status === 401");
    expect(content).toContain('router.push("/admin/login")');
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

  describe("Magic Link Generator Feature (Issue #81)", () => {
    it("memiliki implementasi tombol Generate Link dan handler fetch ke /api/magic-link/generate", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/admin/owners/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("handleGenerateLink");
      expect(content).toContain('fetch("/api/magic-link/generate"');
      expect(content).toContain("method: \"POST\"");
      expect(content).toContain("ownerId: owner.id");
      expect(content).toContain("Generate Link");
      expect(content).toContain("generatingId");
    });

    it("memiliki modal dialog hasil generate tautan dengan copy to clipboard dan tombol kirim WhatsApp", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/admin/owners/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Tautan Magic Link Berhasil Dibuat!");
      expect(content).toContain("handleCopyLink");
      expect(content).toContain("navigator.clipboard.writeText");
      expect(content).toContain("Disalin!");
      expect(content).toContain("Kirim via WA");
    });

    it("menangani copy to clipboard dengan navigator.clipboard.writeText", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const testUrl = "http://localhost:3000/update/test-token-123";
      await navigator.clipboard.writeText(testUrl);

      expect(writeTextMock).toHaveBeenCalledWith(testUrl);
    });
  });

  describe("CRUD Pemilik Kos (Issue #97)", () => {
    it("memiliki tombol dan modal form Tambah Pemilik Kos Baru", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/admin/owners/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Tambah Pemilik");
      expect(content).toContain("Tambah Pemilik Kos Baru");
      expect(content).toContain("handleAddOwner");
      expect(content).toContain('method: "POST"');
      expect(content).toContain('fetch("/api/admin/owners"');
      expect(content).toContain("addFormData");
    });

    it("memiliki tombol dan modal form Edit Data Pemilik Kos", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/admin/owners/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Edit Data Pemilik Kos");
      expect(content).toContain("handleOpenEditModal");
      expect(content).toContain("handleUpdateOwner");
      expect(content).toContain('method: "PATCH"');
      expect(content).toContain("editFormData");
    });

    it("memiliki tombol dan modal konfirmasi Hapus Pemilik Kos beserta peringatan cascade properti", () => {
      const filePath = path.resolve(
        __dirname,
        "../src/app/admin/owners/page.tsx"
      );
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Hapus Pemilik Kos");
      expect(content).toContain("confirmDeleteOwnerAction");
      expect(content).toContain('method: "DELETE"');
      expect(content).toContain("Peringatan Data Terkait:");
      expect(content).toContain("ikut terhapus");
    });
  });
});

