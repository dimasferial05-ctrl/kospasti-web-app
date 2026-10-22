import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeImage } from "../src/components/ui/ThemeImage";

// Mock next-themes
let currentTheme = "light";
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: currentTheme,
    resolvedTheme: currentTheme,
    setTheme: vi.fn(),
  }),
}));

describe("Pencegahan Double Download Gambar Mode Terang/Gelap (Issue #326)", () => {
  beforeEach(() => {
    currentTheme = "light";
    vi.restoreAllMocks();
  });

  describe("Komponen ThemeImage (src/components/ui/ThemeImage.tsx)", () => {
    it("merender 1 elemen img dengan srcLight secara default pada SSR / mode terang", () => {
      const html = renderToStaticMarkup(
        <ThemeImage
          srcLight="/images/desktop-preview.jpeg"
          srcDark="/images/desktop-dark-preview.jpeg"
          alt="Desktop Preview"
          width={500}
          height={300}
          className="mockup-img"
        />
      );

      // Hanya terdapat 1 gambar di output HTML
      const imgMatches = html.match(/<img/g);
      expect(imgMatches?.length).toBe(1);

      // Memastikan src yang dirender adalah versi terang (srcLight)
      expect(html).toContain("desktop-preview.jpeg");
      expect(html).not.toContain("desktop-dark-preview.jpeg");
      expect(html).toContain('alt="Desktop Preview"');
      expect(html).toContain("mockup-img");
    });
  });

  describe("Pencegahan Duplikasi di HowItWorksSection.tsx", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/components/landing/HowItWorksSection.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    it("menggunakan ThemeImage dan tidak lagi menduplikasi gambar dengan kelas 'block dark:hidden' dan 'hidden dark:block'", () => {
      expect(content).toContain('import { ThemeImage } from "@/components/ui/ThemeImage"');
      expect(content).toContain('srcLight="/images/desktop-preview.jpeg"');
      expect(content).toContain('srcDark="/images/desktop-dark-preview.jpeg"');
      expect(content).toContain('srcLight="/images/mobile-preview.jpeg"');
      expect(content).toContain('srcDark="/images/mobile-dark-preview.jpeg"');

      // Memastikan tidak ada lagi pola double render via display: none
      expect(content).not.toContain("block dark:hidden");
      expect(content).not.toContain("hidden dark:block");
    });
  });

  describe("Pencegahan Duplikasi di LandingFooter.tsx", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/components/landing/LandingFooter.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    it("menggunakan ThemeImage untuk logo dan skyline tanpa menduplikasi aset 1.34 MB", () => {
      expect(content).toContain('import { ThemeImage } from "@/components/ui/ThemeImage"');
      expect(content).toContain('srcLight="/logo.jpg"');
      expect(content).toContain('srcDark="/logo-dark.png"');
      expect(content).toContain('srcLight="/images/footer-skyline.jpg"');
      expect(content).toContain('srcDark="/images/footer-skyline-dark.png"');

      // Memastikan tidak ada lagi pola double render via display: none
      expect(content).not.toContain("block dark:hidden");
      expect(content).not.toContain("hidden dark:block");
    });
  });
});
