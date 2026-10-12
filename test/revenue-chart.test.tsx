import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

describe("RevenueChart Component Tests - Issue #245", () => {
  it("merender empty state dengan benar saat data omzet kosong", () => {
    const emptyData = [
      { month: "Mei 2026", monthKey: "2026-05", revenue: 0, bookingsCount: 0 },
      { month: "Jun 2026", monthKey: "2026-06", revenue: 0, bookingsCount: 0 },
    ];

    const html = renderToStaticMarkup(<RevenueChart data={emptyData} />);
    expect(html).toContain("Belum ada transaksi berhasil");
    expect(html).toContain("Grafik analitik pendapatan akan muncul otomatis");
  });

  it("merender grafik batang dengan nominal total periode dan label bulan", () => {
    const sampleData = [
      { month: "Mei 2026", monthKey: "2026-05", revenue: 1500000, bookingsCount: 1 },
      { month: "Jun 2026", monthKey: "2026-06", revenue: 3000000, bookingsCount: 2 },
      { month: "Jul 2026", monthKey: "2026-07", revenue: 4500000, bookingsCount: 3 },
    ];

    const html = renderToStaticMarkup(
      <RevenueChart
        data={sampleData}
        title="Tren Pendapatan Bulanan Mitra"
        badgeText="Omzet Mitra"
      />
    );

    // Judul & Badge
    expect(html).toContain("Tren Pendapatan Bulanan Mitra");
    expect(html).toContain("Omzet Mitra");

    // Total Periode (1.5jt + 3jt + 4.5jt = 9jt)
    expect(html).toContain("9.000.000");

    // Label Bulan
    expect(html).toContain("Mei 2026");
    expect(html).toContain("Jun 2026");
    expect(html).toContain("Jul 2026");

    // Total Booking (1 + 2 + 3 = 6)
    expect(html).toContain("6 Total Booking");
  });
});
