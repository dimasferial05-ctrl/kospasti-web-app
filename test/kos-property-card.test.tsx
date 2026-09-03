import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { KosPropertyCard } from "../src/components/shared/KosPropertyCard";

describe("KosPropertyCard Component", () => {
  const defaultProps = {
    name: "Kos Mawar Putra",
    price: 500000,
    availableRooms: 2,
    genderType: "PUTRA",
    facilities: "WiFi, Kasur, Kamar Mandi Dalam",
    imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5",
    ownerName: "Pak Bambang",
    lastUpdated: "2026-10-12T10:00:00.000Z",
  };

  it("tidak melempar eror (crash) ketika imageUrl bernilai null atau kosong", () => {
    expect(() => {
      const html = renderToStaticMarkup(
        <KosPropertyCard {...defaultProps} imageUrl={null} />
      );
      expect(html).toContain("Kos Mawar Putra");
    }).not.toThrow();

    expect(() => {
      const html = renderToStaticMarkup(
        <KosPropertyCard {...defaultProps} imageUrl={undefined} />
      );
      expect(html).toContain("Kos Mawar Putra");
    }).not.toThrow();
  });

  it("menampilkan tag img jika imageUrl tersedia", () => {
    const html = renderToStaticMarkup(
      <KosPropertyCard {...defaultProps} imageUrl="https://example.com/kos.jpg" />
    );
    expect(html).toContain("<img");
    expect(html).toContain('src="https://example.com/kos.jpg"');
    expect(html).toContain('alt="Kos Mawar Putra"');
  });

  it("otomatis memformat harga menjadi gaya Rupiah (Rp)", () => {
    const html = renderToStaticMarkup(
      <KosPropertyCard {...defaultProps} price={500000} />
    );
    expect(html).toContain("Rp 500.000 / bulan");
  });

  it("menampilkan lencana abu-abu bertuliskan 'Penuh' jika availableRooms bernilai 0", () => {
    const html = renderToStaticMarkup(
      <KosPropertyCard {...defaultProps} availableRooms={0} />
    );
    expect(html).toContain("Penuh");
    expect(html).toContain("bg-slate-200");
    expect(html).toContain("text-slate-600");
    expect(html).not.toContain("Sisa 0 Kamar");
  });

  it("menampilkan lencana hijau jika availableRooms di atas 0", () => {
    const html = renderToStaticMarkup(
      <KosPropertyCard {...defaultProps} availableRooms={3} />
    );
    expect(html).toContain("Sisa 3 Kamar");
    expect(html).toContain("bg-green-100");
    expect(html).toContain("text-green-700");
    expect(html).not.toContain("Penuh");
  });

  it("menampilkan informasi nama pemilik kos, fasilitas, dan tipe gender", () => {
    const html = renderToStaticMarkup(
      <KosPropertyCard {...defaultProps} />
    );
    expect(html).toContain("Pak Bambang");
    expect(html).toContain("WiFi, Kasur, Kamar Mandi Dalam");
    expect(html).toContain("PUTRA");
  });
});
