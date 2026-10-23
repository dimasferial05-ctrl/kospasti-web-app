import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { KosPropertyCard } from "../src/components/features/KosPropertyCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("KosPropertyCard Mobile Touch Ergonomics (Issue #344)", () => {
  const multiSlideProps = {
    name: "Kos Melati Nyaman",
    price: 650000,
    availableRooms: 3,
    genderType: "PUTRI" as const,
    facilities: "WiFi, Kasur",
    imageUrl: "https://example.com/main.jpg",
    roomTypes: [
      { name: "Standar", price_per_month: 650000, image_url: "https://example.com/slide2.jpg" },
    ],
  };

  it("menyediakan tombol panah dengan target sentuh ergonomis dan visibilitas ramah mobile", () => {
    const html = renderToStaticMarkup(<KosPropertyCard {...multiSlideProps} />);

    // Memastikan tombol foto sebelumnya & berikutnya ada
    expect(html).toContain('aria-label="Foto sebelumnya"');
    expect(html).toContain('aria-label="Foto berikutnya"');

    // Memverifikasi visibilitas mobile-friendly (terlihat di layar sentuh, hover di desktop)
    expect(html).toContain("opacity-90");
    expect(html).toContain("sm:opacity-0");
    expect(html).toContain("sm:group-hover:opacity-100");

    // Memverifikasi area sentuh ergonomis (WCAG & Apple HIG >= 44x44px via before:-inset-2)
    expect(html).toContain("before:-inset-2");
    expect(html).toContain("touch-manipulation");

    // Memverifikasi aksesibilitas fokus keyboard
    expect(html).toContain("focus-visible:ring-emerald-500");
  });

  it("tidak menampilkan tombol navigasi panah jika hanya ada satu foto / tidak ada roomTypes bergambar", () => {
    const singleSlideProps = {
      name: "Kos Melati Nyaman",
      price: 650000,
      availableRooms: 3,
      genderType: "PUTRI" as const,
      facilities: "WiFi, Kasur",
      imageUrl: "https://example.com/main.jpg",
    };

    const html = renderToStaticMarkup(<KosPropertyCard {...singleSlideProps} />);

    expect(html).not.toContain('aria-label="Foto sebelumnya"');
    expect(html).not.toContain('aria-label="Foto berikutnya"');
  });
});
