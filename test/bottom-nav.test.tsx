import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNav } from "../src/components/layout/BottomNav";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("BottomNav Component (/components/layout/BottomNav) - Issue #170", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/";
  });

  it("memiliki direktif 'use client' di baris paling awal file", () => {
    const filePath = path.resolve(__dirname, "../src/components/layout/BottomNav.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const firstLine = content.trim().split("\n")[0].trim();
    expect(firstLine).toMatch(/^["']use client["'];?$/);
  });

  it("tidak merender apa pun ketika isLoggedIn bernilai false", () => {
    mockPathname = "/";
    const html = renderToStaticMarkup(<BottomNav isLoggedIn={false} />);
    expect(html).toBe("");
  });

  it("merender 4 item menu (Eksplor, Peta, Favorit, Profil) ketika isLoggedIn bernilai true", () => {
    mockPathname = "/search";
    const html = renderToStaticMarkup(<BottomNav isLoggedIn={true} />);

    expect(html).toContain("Eksplor");
    expect(html).toContain("Peta");
    expect(html).toContain("Favorit");
    expect(html).toContain("Profil");
    expect(html).toContain('href="/search"');
    expect(html).toContain('href="/map"');
    expect(html).toContain('href="/favorit"');
    expect(html).toContain('href="/profil"');
  });

  it("menyembunyikan BottomNav pada rute /admin", () => {
    mockPathname = "/admin";
    const adminHtml = renderToStaticMarkup(<BottomNav isLoggedIn={true} />);
    expect(adminHtml).toBe("");

    mockPathname = "/admin/properties";
    const adminSubHtml = renderToStaticMarkup(<BottomNav isLoggedIn={true} />);
    expect(adminSubHtml).toBe("");
  });

  it("menyembunyikan BottomNav pada halaman /login dan /register", () => {
    mockPathname = "/login";
    const loginHtml = renderToStaticMarkup(<BottomNav isLoggedIn={true} />);
    expect(loginHtml).toBe("");

    mockPathname = "/register";
    const registerHtml = renderToStaticMarkup(<BottomNav isLoggedIn={true} />);
    expect(registerHtml).toBe("");
  });
});
