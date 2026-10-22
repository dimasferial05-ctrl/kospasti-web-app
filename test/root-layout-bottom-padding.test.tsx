import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("RootLayout Bottom Padding Responsiveness (Issue 80px Gap on Anonymous Mobile)", () => {
  it("tidak lagi menggunakan class statis hardcoded pb-20 tanpa pengecekan status login", () => {
    const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    // Memastikan class statis yang menyebabkan celah 80px di HP sudah dihapus
    expect(content).not.toContain('className="flex-1 pb-20 md:pb-0 flex flex-col"');
  });

  it("menerapkan class pb-20 md:pb-0 secara kondisional berdasarkan status isLoggedIn", () => {
    const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    // Memastikan ada pengecekan kondisional isLoggedIn untuk pb-20
    expect(content).toMatch(/isLoggedIn\s*\?\s*["']pb-20 md:pb-0["']/);
  });
});
