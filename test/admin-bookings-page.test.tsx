import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import ManageBookingsPage from "../src/app/admin/bookings/page";

describe("Manage Bookings Page (/admin/bookings)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
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

    const html = renderToStaticMarkup(<ManageBookingsPage />);
    expect(html).toContain("Memuat riwayat transaksi...");
  });

  it("memiliki struktur tabel Enterprise dengan header kolom lengkap termasuk Aksi", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    // Judul & Deskripsi
    expect(content).toContain("Riwayat Booking Mahasiswa");
    expect(content).toContain("Pantau transaksi pemesanan kamar secara real-time.");

    // Header tabel
    expect(content).toContain("ID Transaksi");
    expect(content).toContain("Nama Mahasiswa");
    expect(content).toContain("Nama Kos");
    expect(content).toContain("Tgl Masuk");
    expect(content).toContain("Status");
    expect(content).toContain("Aksi");
  });

  it("memiliki logika badge status transaksi (SUCCESS hijau, PENDING kuning, REJECTED merah)", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('status === "SUCCESS"');
    expect(content).toContain("bg-green-100 text-green-700");
    expect(content).toContain('status === "PENDING"');
    expect(content).toContain("bg-yellow-100 text-yellow-700");
    expect(content).toContain('status === "REJECTED"');
    expect(content).toContain("bg-rose-100 text-rose-700");
  });

  it("memiliki tombol aksi Setujui dan Tolak untuk transaksi berstatus PENDING", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Setujui");
    expect(content).toContain("Tolak");
    expect(content).toContain("handleUpdateStatus");
    expect(content).toContain('method: "PATCH"');
    expect(content).toContain("PATCH");
    expect(content).toContain("/api/admin/bookings/");
  });

  it("menampilkan potongan ID transaksi dan format tanggal lokal id-ID", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain(".split");
    expect(content).toContain("toLocaleDateString");
    expect(content).toContain("id-ID");
  });

  it("menampilkan pesan empty state saat tidak ada riwayat transaksi", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("bookings.length === 0");
    expect(content).toContain("Belum ada riwayat transaksi.");
  });

  it("menyertakan header Authorization Bearer token dari sessionStorage saat memanggil API /api/admin/bookings dan menangani status 401", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/bookings/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/bookings"');
    expect(content).toContain('sessionStorage.getItem("adminAuth")');
    expect(content).toContain("Authorization:");
    expect(content).toContain("Bearer ${token");
    expect(content).toContain("res.status === 401");
    expect(content).toContain('sessionStorage.removeItem("adminAuth")');
  });
});
