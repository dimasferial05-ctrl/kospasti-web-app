import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import AdminDashboardOverview from "../src/app/admin/page";

describe("Admin Dashboard Overview Page (/admin)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/page.tsx"
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

    const html = renderToStaticMarkup(<AdminDashboardOverview />);
    expect(html).toContain("Mengumpulkan data statistik...");
  });

  it("memiliki tata letak responsif grid untuk 3 kartu statistik", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Grid responsif (1 kolom di mobile, 3 kolom di md)
    expect(content).toContain("grid-cols-1");
    expect(content).toContain("md:grid-cols-3");
  });

  it("memiliki 3 kartu statistik lengkap dengan label dan satuan masing-masing", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Kartu 1: Total Properti
    expect(content).toContain("Total Properti");
    expect(content).toContain("Kos");

    // Kartu 2: Kamar Tersedia
    expect(content).toContain("Kamar Tersedia");
    expect(content).toContain("Kamar");

    // Kartu 3: Booking Masuk
    expect(content).toContain("Booking Masuk");
    expect(content).toContain("Pesanan");
  });

  it("memiliki area placeholder untuk analitik grafik di masa depan", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Area ini disiapkan untuk grafik analitik di masa mendatang");
  });

  it("menyertakan header Authorization Bearer token dari sessionStorage saat memanggil API /api/admin/stats dan menangani status 401", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/stats"');
    expect(content).toContain('sessionStorage.getItem("adminAuth")');
    expect(content).toContain("Authorization:");
    expect(content).toContain("Bearer ${token");
    expect(content).toContain("res.status === 401");
    expect(content).toContain('sessionStorage.removeItem("adminAuth")');
  });
});
