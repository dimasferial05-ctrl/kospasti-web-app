import { describe, it, expect, vi } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchFilter } from "../src/components/shared/SearchFilter";

describe("SearchFilter Component", () => {
  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/components/shared/SearchFilter.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender form pencarian dan elemen input teks serta dropdown dengan benar", () => {
    const onSearchMock = vi.fn();
    const html = renderToStaticMarkup(<SearchFilter onSearch={onSearchMock} />);

    // Input pencarian nama
    expect(html).toContain('placeholder="Cari nama kos..."');
    expect(html).toContain('type="text"');

    // Dropdown batas harga maksimal
    expect(html).toContain("Batas Harga");
    expect(html).toContain("Semua Harga");
    expect(html).toContain('value="500000"');
    expect(html).toContain('value="1000000"');
    expect(html).toContain('value="2000000"');

    // Dropdown tipe gender
    expect(html).toContain("Tipe Kos");
    expect(html).toContain("Semua Tipe");
    expect(html).toContain('value="PUTRA"');
    expect(html).toContain('value="PUTRI"');
    expect(html).toContain('value="CAMPUR"');

    // Tombol submit
    expect(html).toContain('type="submit"');
    expect(html).toContain("Cari Kos");
  });

  it("merender nilai awal (initialValues) ke dalam input dan dropdown secara tepat", () => {
    const onSearchMock = vi.fn();
    const html = renderToStaticMarkup(
      <SearchFilter
        onSearch={onSearchMock}
        initialValues={{
          name: "Kos Melati",
          maxPrice: "1000000",
          genderType: "PUTRI",
        }}
      />
    );

    expect(html).toContain('value="Kos Melati"');
    expect(html).toContain('value="1000000"');
    expect(html).toContain('value="PUTRI"');
  });

  it("menerapkan tata letak responsif mobile-first menggunakan grid 2 kolom", () => {
    const onSearchMock = vi.fn();
    const html = renderToStaticMarkup(<SearchFilter onSearch={onSearchMock} />);

    expect(html).toContain("grid grid-cols-2 gap-3");
    expect(html).toContain("w-full");
  });
});
