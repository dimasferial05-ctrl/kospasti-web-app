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
});
