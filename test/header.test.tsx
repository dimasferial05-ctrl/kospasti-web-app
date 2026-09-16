import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { Header } from "../src/components/shared/Header";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Header Component (/components/shared/Header) - Issue #133", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/";
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/components/shared/Header.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("merender logo KosPasti dan tombol Keluar Akun pada halaman umum", () => {
    mockPathname = "/";
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain("KosPasti");
    expect(html).toContain("🏠");
    expect(html).toContain("Keluar Akun");
  });

  it("menyembunyikan header secara keseluruhan pada rute /admin", () => {
    mockPathname = "/admin";
    const adminHtml = renderToStaticMarkup(<Header />);
    expect(adminHtml).toBe("");

    mockPathname = "/admin/properties";
    const adminSubHtml = renderToStaticMarkup(<Header />);
    expect(adminSubHtml).toBe("");
  });

  it("menyembunyikan tombol logout pada halaman /login dan /register", () => {
    mockPathname = "/login";
    const loginHtml = renderToStaticMarkup(<Header />);
    expect(loginHtml).toContain("KosPasti");
    expect(loginHtml).not.toContain("Keluar Akun");

    mockPathname = "/register";
    const registerHtml = renderToStaticMarkup(<Header />);
    expect(registerHtml).toContain("KosPasti");
    expect(registerHtml).not.toContain("Keluar Akun");
  });

  it("memiliki implementasi pemanggilan /api/logout, router.push('/login'), dan router.refresh()", () => {
    const filePath = path.resolve(__dirname, "../src/components/shared/Header.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('fetch("/api/logout"');
    expect(content).toContain('method: "POST"');
    expect(content).toContain('router.push("/login")');
    expect(content).toContain("router.refresh()");
  });
});
