import { describe, it, expect, vi } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { SmartSearchBar } from "../src/components/features/SmartSearchBar";

describe("SmartSearchBar Accessibility & WAI-ARIA Combobox - Issue #322", () => {
  describe("1. Label Aksesibel & Semantik Input Combobox", () => {
    it("merender tag input dengan atribut aria-label deskriptif", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar onSearch={vi.fn()} />
      );

      expect(html).toContain('aria-label="Cari kos berdasarkan lokasi, kampus, atau fasilitas"');
    });

    it("merender atribut WAI-ARIA combobox (role, aria-autocomplete, aria-expanded, aria-controls)", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar onSearch={vi.fn()} />
      );

      expect(html).toContain('role="combobox"');
      expect(html).toContain('aria-autocomplete="list"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="location-suggestions-list"');
    });

    it("merender tombol submit dengan atribut aria-label='Cari kos'", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar onSearch={vi.fn()} />
      );

      expect(html).toContain('aria-label="Cari kos"');
    });

    it("merender tombol reset dengan atribut aria-label='Reset pencarian' ketika ada query", () => {
      const html = renderToStaticMarkup(
        <SmartSearchBar
          value="Polsub"
          showReset={true}
          onReset={vi.fn()}
          onSearch={vi.fn()}
        />
      );

      expect(html).toContain('aria-label="Reset pencarian"');
    });
  });

  describe("2. Semantik WAI-ARIA Listbox & Option pada Dropdown", () => {
    const componentPath = path.resolve(
      __dirname,
      "../src/components/features/SmartSearchBar.tsx"
    );
    const content = fs.readFileSync(componentPath, "utf-8");

    it("memastikan kontainer rekomendasi memiliki id='location-suggestions-list' dan role='listbox'", () => {
      expect(content).toContain('id="location-suggestions-list"');
      expect(content).toContain('role="listbox"');
      expect(content).toContain('aria-label="Rekomendasi Lokasi"');
    });

    it("memastikan setiap item saran memiliki role='option' dan atribut aria-selected", () => {
      expect(content).toContain('role="option"');
      expect(content).toContain('aria-selected={isHighlighted}');
      expect(content).toContain('id={`suggestion-item-${idx}`}');
    });

    it("memastikan input combobox memiliki binding aria-activedescendant saat item disorot", () => {
      expect(content).toContain("aria-activedescendant=");
      expect(content).toContain("`suggestion-item-${highlightedIndex}`");
    });
  });
});
