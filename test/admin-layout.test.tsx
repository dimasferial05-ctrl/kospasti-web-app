import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import AdminLayout from "../src/app/admin/layout";
import RootLayout from "../src/app/layout";
import { Header } from "../src/components/shared/Header";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Admin Layout & Protection Component (/admin/layout)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/admin";
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender form login PIN jika belum terautentikasi (tampilan gelap)", () => {
    const html = renderToStaticMarkup(
      <AdminLayout>
        <div>Admin Protected Content</div>
      </AdminLayout>
    );

    // Harus menampilkan form login dan tidak menampilkan children jika belum auth
    expect(html).toContain("Login Admin KosPasti");
    expect(html).toContain("Masukkan PIN Admin");
    expect(html).toContain("Masuk Ruang Tahta");
    expect(html).toContain("bg-slate-900");
    expect(html).not.toContain("Admin Protected Content");
  });

  it("memiliki struktur dan logika validasi PIN '778899'", () => {
    const filePath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Cek PIN Hardcoded
    expect(content).toContain('"778899"');
    expect(content).toContain("sessionStorage.setItem(\"adminAuth\", \"true\")");
    expect(content).toContain("sessionStorage.getItem(\"adminAuth\")");

    // Pesan error jika salah
    expect(content).toContain("PIN salah. Akses ditolak.");
    expect(content).toContain("text-red-500");
  });

  it("memiliki struktur Sidebar admin lengkap dengan navigasi dan tombol logout", () => {
    const filePath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Sidebar styling
    expect(content).toContain("w-64 bg-slate-950 text-slate-300");
    expect(content).toContain("ADMIN");
    expect(content).toContain("MAIN NAVIGATION");

    // Link Navigasi
    expect(content).toContain('href="/admin"');
    expect(content).toContain("Dashboard");
    expect(content).toContain('href="/admin/properties"');
    expect(content).toContain("Kelola Properti");
    expect(content).toContain('href="/admin/bookings"');
    expect(content).toContain("Data Transaksi");

    // Tombol Logout
    expect(content).toContain("Logout");
    expect(content).toContain("sessionStorage.removeItem(\"adminAuth\")");

    // Main Content container desktop
    expect(content).toContain("ml-64");
    expect(content).toContain("p-8");
  });
});

describe("Root Layout & Header Integration", () => {
  it("memastikan root layout tidak lagi dibatasi oleh class max-w-md di body", () => {
    const filePath = path.resolve(__dirname, "../src/app/layout.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain("max-w-md");
    expect(content).not.toContain("mx-auto");
    expect(content).toContain("bg-slate-50 text-slate-900 antialiased");
  });

  it("menyembunyikan Header secara otomatis ketika berada di rute /admin", () => {
    mockPathname = "/admin";
    const adminHeaderHtml = renderToStaticMarkup(<Header />);
    expect(adminHeaderHtml).toBe("");

    mockPathname = "/";
    const homeHeaderHtml = renderToStaticMarkup(<Header />);
    expect(homeHeaderHtml).toContain("KosPasti");
    expect(homeHeaderHtml).toContain("🏠");
  });
});
