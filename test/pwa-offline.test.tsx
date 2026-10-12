import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import OfflineFallbackPage from "../src/app/~offline/page";
import { NetworkStatusNotifier } from "../src/components/pwa/NetworkStatusNotifier";

describe("PWA Offline & Native Enhancements - Issue #243", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Manifest App Shortcuts", () => {
    it("memiliki array shortcuts pada manifest.json dengan 4 menu utama", () => {
      const manifestPath = path.resolve(__dirname, "../public/manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(Array.isArray(content.shortcuts)).toBe(true);
      expect(content.shortcuts.length).toBeGreaterThanOrEqual(4);

      const urls = content.shortcuts.map((s: { url: string }) => s.url);
      expect(urls).toContain("/search");
      expect(urls).toContain("/map");
      expect(urls).toContain("/favorit");
      expect(urls).toContain("/profil?tab=bookings");
    });
  });

  describe("2. Offline Fallback Page (~offline)", () => {
    it("merender komponen OfflineFallbackPage dengan elemen judul, pesan, dan aksi interaktif", () => {
      const html = renderToStaticMarkup(<OfflineFallbackPage />);

      expect(html).toContain("Koneksi Terputus");
      expect(html).toContain("Anda sedang berada di mode offline");
      expect(html).toContain("Coba Hubungkan Kembali");
      expect(html).toContain("Kembali ke Beranda");
    });

    it("memiliki direktif 'use client' di baris awal file ~offline/page.tsx", () => {
      const filePath = path.resolve(__dirname, "../src/app/~offline/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      const firstLine = content.trim().split("\n")[0].trim();
      expect(firstLine).toMatch(/^["']use client["'];?$/);
    });
  });

  describe("3. Network Status Notifier Component", () => {
    it("terpasang di layout.tsx", () => {
      const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");
      expect(content).toContain("NetworkStatusNotifier");
    });

    it("tidak merender apa-apa saat online secara default di server rendering", () => {
      const html = renderToStaticMarkup(<NetworkStatusNotifier />);
      expect(html).toBe("");
    });
  });
});
