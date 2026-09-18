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

import AdminUsersPage from "../src/app/admin/users/page";

describe("Admin Users Management Page (/admin/users)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
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

    const html = renderToStaticMarkup(<AdminUsersPage />);
    expect(html).toContain("Memuat data pengguna...");
  });

  it("memiliki struktur tabel Enterprise dengan header kolom lengkap", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Judul & Deskripsi
    expect(content).toContain("Manajemen Pengguna");
    expect(content).toContain(
      "Daftar seluruh pencari kos yang terdaftar di platform KosPasti."
    );

    // Header tabel
    expect(content).toContain("Pengguna");
    expect(content).toContain("Email");
    expect(content).toContain("Nomor WhatsApp");
    expect(content).toContain("Bio");
    expect(content).toContain("Total Booking");
    expect(content).toContain("Terdaftar");
    expect(content).toContain("Aksi");
  });

  it("memiliki fitur pencarian (search bar) berdasarkan nama, email, atau WhatsApp", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Cari nama, email, atau WhatsApp...");
    expect(content).toContain("searchQuery");
    expect(content).toContain("filteredUsers");
    expect(content).toContain("user.name?.toLowerCase().includes");
    expect(content).toContain("user.email?.toLowerCase().includes");
  });

  it("memiliki tombol chat WhatsApp dan modal detail profil", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("https://wa.me/");
    expect(content).toContain("Chat");
    expect(content).toContain("selectedUser");
    expect(content).toContain("Detail Profil Pengguna");
  });

  it("memanggil API /api/admin/users dan menangani redirect status 401 ke /admin/login", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/users"');
    expect(content).toContain("res.status === 401");
    expect(content).toContain('router.push("/admin/login")');
  });

  it("menampilkan empty state ketika data tidak ditemukan atau kosong", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/users/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("filteredUsers.length === 0");
    expect(content).toContain("Belum ada data pengguna terdaftar.");
  });
});
