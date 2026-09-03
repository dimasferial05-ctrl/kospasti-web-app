import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/page";

describe("Home Page Component (/)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/app/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender komponen filter dan status loading pada saat inisialisasi", () => {
    // Mock global fetch agar tidak melakukan real network request
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(() => {
        // Pending promise to simulate initial loading state in SSR/static render
      })
    );

    const html = renderToStaticMarkup(<Home />);

    // Search filter elements
    expect(html).toContain("Cari nama kos...");
    expect(html).toContain("Batas Harga");
    expect(html).toContain("Tipe Kos");
    expect(html).toContain("Cari Kos");

    // Loading indicator
    expect(html).toContain("Memuat daftar kos...");
  });
});
