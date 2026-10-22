import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

describe("RevenueChart Keyboard & Screen Reader Accessibility Tests (WCAG 2.1)", () => {
  const sampleData = [
    { month: "Mei 2026", monthKey: "2026-05", revenue: 1500000, bookingsCount: 3 },
    { month: "Jun 2026", monthKey: "2026-06", revenue: 2500000, bookingsCount: 5 },
  ];

  it("merender elemen batang diagram dengan tabIndex 0 dan role graphics-symbol", () => {
    const html = renderToStaticMarkup(<RevenueChart data={sampleData} />);

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="graphics-symbol"');
  });

  it("menyediakan aria-label informatif yang memuat nama bulan, nominal rupiah, dan jumlah pesanan", () => {
    const html = renderToStaticMarkup(<RevenueChart data={sampleData} />);

    // Memverifikasi bahwa setiap batang diagram memiliki teks label deskriptif
    expect(html).toMatch(/aria-label="Bulan Mei 2026:[^"]*1\.500\.000[^"]*3 pesanan"/);
    expect(html).toMatch(/aria-label="Bulan Jun 2026:[^"]*2\.500\.000[^"]*5 pesanan"/);
  });

  it("menerapkan class focus ring focus-visible dengan warna emerald dan offset yang sesuai", () => {
    const html = renderToStaticMarkup(<RevenueChart data={sampleData} />);

    expect(html).toContain("focus:outline-none");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-emerald-500");
    expect(html).toContain("focus-visible:ring-offset-2");
    expect(html).toContain("dark:focus-visible:ring-offset-slate-900");
    expect(html).toContain("rounded-xl");
  });

  it("memiliki handler onFocus dan onBlur pada kode sumber RevenueChart.tsx untuk memicu tooltip melalui keyboard", () => {
    const filePath = path.resolve(__dirname, "../src/components/dashboard/RevenueChart.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("onFocus={() => setHoveredIndex(index)}");
    expect(content).toContain("onBlur={() => setHoveredIndex(null)}");
  });
});
