import { describe, it, expect, vi } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { SmartSearchBar, DEFAULT_SUGGESTIONS } from "../src/components/features/SmartSearchBar";

describe("Smart Search Bar Readability & Subang Context (Issue #259)", () => {
  describe("1. Relevansi Konteks Wilayah Subang", () => {
    it("memastikan seluruh DEFAULT_SUGGESTIONS berbasis di Kabupaten Subang", () => {
      const labels = DEFAULT_SUGGESTIONS.map((s) => s.label);
      const prompts = DEFAULT_SUGGESTIONS.map((s) => s.prompt);

      // Harus mencantumkan titik referensi Subang
      expect(labels).toContain("Dekat Polsub Subang");
      expect(labels).toContain("Dekat Alun-Alun Subang");
      expect(labels).toContain("Dekat RSUD Subang");

      // Tidak boleh ada wilayah Jakarta / Depok dummy
      labels.forEach((label) => {
        expect(label).not.toContain("UI");
        expect(label).not.toContain("Monas");
        expect(label).not.toContain("Gandaria");
      });

      prompts.forEach((prompt) => {
        expect(prompt.toLowerCase()).toContain("subang");
      });
    });
  });

  describe("2. Keterbacaan & Kontras Visual SmartSearchBar", () => {
    it("merender label 'Saran:' dengan kontras tinggi (text-slate-700/300, font-bold)", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar onSearch={vi.fn()} showSuggestions={true} />
      );

      expect(html).toContain("Saran:");
      expect(html).toContain("text-slate-700");
      expect(html).toContain("font-bold");
    });

    it("merender chip saran dengan background solid, teks kontras, dan interaksi taktil", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar onSearch={vi.fn()} showSuggestions={true} />
      );

      // Pastikan ada chip saran Subang
      expect(html).toContain("Dekat Polsub Subang");
      expect(html).toContain("Dekat Alun-Alun Subang");

      // Styling chip harus kontras tinggi dan taktil
      expect(html).toContain("bg-white");
      expect(html).toContain("text-slate-700");
      expect(html).toContain("font-semibold");
      expect(html).toContain("border-slate-200/90");
      expect(html).toContain("active:scale-95");
    });
  });

  describe("3. Pembersihan Latar Belakang & Toolbar Kontras pada Halaman /map", () => {
    it("memastikan search card pada src/app/map/page.tsx tidak lagi merender canvas shader IsolineBloom", () => {
      const mapFilePath = path.resolve(__dirname, "../src/app/map/page.tsx");
      const content = fs.readFileSync(mapFilePath, "utf-8");

      // Shader yang membuat kotak kelabu muram harus sudah dihapus
      expect(content).not.toContain("<IsolineBloom");
      expect(content).not.toContain("import IsolineBloom");
    });

    it("memastikan kartu search di /map berpenampilan bersih dan tegas (bg-white, shadow-soft)", () => {
      const mapFilePath = path.resolve(__dirname, "../src/app/map/page.tsx");
      const content = fs.readFileSync(mapFilePath, "utf-8");

      expect(content).toContain("bg-white dark:bg-slate-900");
      expect(content).toContain("rounded-2xl sm:rounded-3xl");
      expect(content).toContain("shadow-soft");
    });

    it("memastikan toolbar Quick Adjustment di /map memiliki teks kontras tinggi (font-bold)", () => {
      const mapFilePath = path.resolve(__dirname, "../src/app/map/page.tsx");
      const content = fs.readFileSync(mapFilePath, "utf-8");

      // Label Filter Manual
      expect(content).toContain("Filter Manual:");
      expect(content).toContain("text-xs font-bold text-slate-700 dark:text-slate-300");

      // Label Harga
      expect(content).toContain("Harga:");

      // Tombol Pill Gender
      expect(content).toContain("bg-emerald-600 text-white");
      expect(content).toContain("active:scale-95");

      // Dropdown Harga
      expect(content).toContain("rounded-xl");
      expect(content).toContain("font-semibold");
    });
  });

  describe("4. Keselarasan Placeholder pada Halaman Pencarian (/search)", () => {
    it("memastikan placeholder pencarian di /search selaras dengan konteks Subang", () => {
      const searchFilePath = path.resolve(__dirname, "../src/app/search/page.tsx");
      const content = fs.readFileSync(searchFilePath, "utf-8");

      expect(content).toContain("Polsub Subang");
      expect(content).not.toContain("dekat UI");
    });
  });
});
