import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { Header } from "../src/components/layout/Header";
import { PwaUpdater } from "../src/components/pwa/PwaUpdater";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock usePwaInstall
let mockIsInstallable = false;
const mockPromptInstall = vi.fn();
vi.mock("@/hooks/usePwaInstall", () => ({
  usePwaInstall: () => ({
    isInstallable: mockIsInstallable,
    isStandalone: false,
    isInstalled: false,
    promptInstall: mockPromptInstall,
  }),
}));

describe("PWA Implementation - Issue #235", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/";
    mockIsInstallable = false;
  });

  describe("1. Manifest & Asset Configurations", () => {
    it("memiliki manifest.json yang valid dengan konfigurasi PWA", () => {
      const manifestPath = path.resolve(__dirname, "../public/manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(content.name).toContain("KosPasti");
      expect(content.short_name).toBe("KosPasti");
      expect(content.start_url).toBe("/");
      expect(content.display).toBe("standalone");
      expect(content.theme_color).toBe("#059669");
      expect(Array.isArray(content.icons)).toBe(true);
      expect(content.icons.length).toBeGreaterThanOrEqual(2);

      const has192 = content.icons.some((i: { sizes: string }) => i.sizes === "192x192");
      const has512 = content.icons.some((i: { sizes: string }) => i.sizes === "512x512");
      expect(has192).toBe(true);
      expect(has512).toBe(true);
    });

    it("memiliki file ikon 192x192 dan 512x512 di folder public/icons/", () => {
      const icon192 = path.resolve(__dirname, "../public/icons/icon-192x192.png");
      const icon512 = path.resolve(__dirname, "../public/icons/icon-512x512.png");
      expect(fs.existsSync(icon192)).toBe(true);
      expect(fs.existsSync(icon512)).toBe(true);
    });

    it("mengonfigurasi next.config.ts dengan withPWAInit dari @ducanh2912/next-pwa", () => {
      const configPath = path.resolve(__dirname, "../next.config.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("@ducanh2912/next-pwa");
      expect(content).toContain("withPWA");
      expect(content).toContain('dest: "public"');
    });

    it("mendaftarkan manifest dan themeColor pada layout.tsx", () => {
      const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain('manifest: "/manifest.json"');
      expect(content).toContain("themeColor");
      expect(content).toContain("PwaUpdater");
    });
  });

  describe("2. UI Install Button in Header", () => {
    it("tidak memunculkan tombol install jika isInstallable bernilai false", () => {
      mockIsInstallable = false;
      const html = renderToStaticMarkup(<Header isLoggedIn={true} />);
      expect(html).not.toContain("Install Aplikasi Desktop");
      expect(html).not.toContain("Install Aplikasi KosPasti");
    });

    it("merender tombol install mobile dan menyediakan opsi desktop dropdown saat isInstallable bernilai true dan user login", () => {
      mockIsInstallable = true;
      const html = renderToStaticMarkup(<Header isLoggedIn={true} />);
      // Tombol install mobile (icon download) langsung dirender di header
      expect(html).toContain("Install Aplikasi KosPasti");

      // Dropdown desktop memiliki opsi Install Aplikasi Desktop
      const headerSource = fs.readFileSync(path.resolve(__dirname, "../src/components/layout/Header.tsx"), "utf-8");
      expect(headerSource).toContain("Install Aplikasi Desktop");
      expect(headerSource).toContain("promptInstall");
    });

    it("merender tombol install saat isInstallable bernilai true untuk user yang belum login", () => {
      mockIsInstallable = true;
      const html = renderToStaticMarkup(<Header isLoggedIn={false} />);
      expect(html).toContain("Install Aplikasi KosPasti");
      expect(html).toContain("Install Aplikasi");
    });
  });

  describe("3. PWA Updater Notification Component", () => {
    it("tidak merender apa-apa secara default saat tidak ada update", () => {
      const html = renderToStaticMarkup(<PwaUpdater />);
      expect(html).toBe("");
    });
  });
});
