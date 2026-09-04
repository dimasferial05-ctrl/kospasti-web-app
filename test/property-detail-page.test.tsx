import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import PropertyDetailPage from "../src/app/kos/[id]/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "uuid-kos-123" }),
}));

describe("Property Detail Page Component (/kos/[id])", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender status loading pada saat inisialisasi", () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Pending promise for initial state
        })
    );

    const html = renderToStaticMarkup(<PropertyDetailPage />);

    expect(html).toContain("Memuat detail kamar...");
  });

  it("memiliki kelas Tailwind wajib untuk Sticky Bottom Bar", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Acceptance Criteria: sticky bottom bar classes
    expect(content).toContain(
      "fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex justify-between items-center z-50"
    );
    expect(content).toContain("Amankan Kamar");
  });

  it("memiliki padding bottom yang cukup (pb-24) agar tidak tertutup bottom bar", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("pb-24");
  });

  it("memiliki penanganan error dan not found dengan tombol kembali ke beranda", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("Kos tidak ditemukan");
    expect(content).toContain("Kembali ke Beranda");
    expect(content).toContain('href="/"');
  });

  it("memiliki struktur tampilan foto utama, fasilitas, dan info pemilik", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Foto utama
    expect(content).toContain("object-cover");
    expect(content).toContain("bg-slate-200");

    // Fasilitas
    expect(content).toContain("Fasilitas Kos");

    // Info Pemilik
    expect(content).toContain("Dikelola oleh");
  });

  it("menangani kondisi kamar habis (isFull) pada tombol Sticky Bottom Bar", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Menghitung variabel isFull berdasarkan available_rooms === 0
    expect(content).toContain("property.available_rooms === 0");

    // Tombol memiliki properti disabled={isFull}
    expect(content).toContain("disabled={isFull}");

    // Tombol memiliki teks dinamis 'Kamar Penuh' vs 'Amankan Kamar'
    expect(content).toContain("isFull ? \"Kamar Penuh\" : \"Amankan Kamar\"");

    // Tombol memiliki kelas visual dinamis abu-abu dan cursor-not-allowed vs biru
    expect(content).toContain("bg-slate-400 cursor-not-allowed");
    expect(content).toContain("bg-blue-600 hover:bg-blue-700");

    // Pesan peringatan opsional jika isFull bernilai true
    expect(content).toContain("Mohon maaf, semua kamar telah terisi.");
  });

  it("memiliki struktur Booking Form Modal yang lengkap dan responsif", () => {
    const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Modal state
    expect(content).toContain("isModalOpen");
    expect(content).toContain("studentName");
    expect(content).toContain("waNumber");
    expect(content).toContain("moveInDate");

    // Pemicu modal pada tombol Amankan Kamar
    expect(content).toContain("setIsModalOpen(true)");

    // Overlay modal dan kartu responsif (bottom sheet pada mobile, center pada desktop)
    expect(content).toContain("fixed inset-0 z-[60] bg-black/60");
    expect(content).toContain("flex items-end sm:items-center justify-center");
    expect(content).toContain("rounded-t-2xl sm:rounded-2xl");

    // Judul dan deskripsi modal
    expect(content).toContain("Lengkapi Data Diri");
    expect(content).toContain("Data ini akan dikirimkan ke Pemilik Kos");

    // Input data diri
    expect(content).toContain('placeholder="Nama Lengkap"');
    expect(content).toContain('type="tel"');
    expect(content).toContain('placeholder="Nomor WhatsApp (Contoh: 0812...)"');
    expect(content).toContain('type="date"');
    expect(content).toContain("min={new Date().toISOString().split(\"T\")[0]}");

    // Tombol aksi modal
    expect(content).toContain("Batal");
    expect(content).toContain("setIsModalOpen(false)");
    expect(content).toContain("Lanjut Pembayaran");
  });
});


