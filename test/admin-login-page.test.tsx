import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import AdminLoginPage from "../src/app/admin/login/page";

describe("Admin Login Page (/admin/login)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/login/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender form login admin dengan input PIN dan tombol submit", () => {
    const html = renderToStaticMarkup(<AdminLoginPage />);

    expect(html).toContain("Login Admin KosPasti");
    expect(html).toContain("Masukkan PIN Admin");
    expect(html).toContain("Masuk Ruang Tahta");
    expect(html).toContain("bg-slate-900");
  });

  it("memiliki handler fetch ke /api/admin/login dengan metode POST", () => {
    const filePath = path.resolve(
      __dirname,
      "../src/app/admin/login/page.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/admin/login"');
    expect(content).toContain('method: "POST"');
    expect(content).toContain("JSON.stringify({ pin })");
    expect(content).toContain('router.push("/admin")');
  });
});
