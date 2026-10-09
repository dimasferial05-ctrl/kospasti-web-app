import { describe, it, expect, vi } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";

describe("Dark Mode Implementation - Issue #237 Acceptance Criteria", () => {
  it("AC 1: next-themes terpasang, ThemeProvider ada di layout.tsx, dan tailwind configured darkMode: 'class'", () => {
    // 1. package.json contains next-themes
    const pkgJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    );
    expect(pkgJson.dependencies["next-themes"]).toBeDefined();

    // 2. tailwind.config.ts has darkMode: 'class'
    const tailwindConfigPath = path.resolve(__dirname, "../tailwind.config.ts");
    expect(fs.existsSync(tailwindConfigPath)).toBe(true);
    const tailwindConfig = fs.readFileSync(tailwindConfigPath, "utf-8");
    expect(tailwindConfig).toMatch(/darkMode:\s*["']class["']/);

    // 3. ThemeProvider component exists and wraps next-themes
    const providerPath = path.resolve(
      __dirname,
      "../src/components/providers/ThemeProvider.tsx"
    );
    expect(fs.existsSync(providerPath)).toBe(true);
    const providerContent = fs.readFileSync(providerPath, "utf-8");
    expect(providerContent).toContain('attribute="class"');
    expect(providerContent).toContain('defaultTheme="system"');
    expect(providerContent).toContain("enableSystem");

    // 4. Root Layout wraps with ThemeProvider and suppresses hydration warning
    const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("<ThemeProvider>");
    expect(layoutContent).toContain("suppressHydrationWarning");
  });

  it("AC 2: Desktop (Belum Login) memiliki ThemeToggle bersebelahan dengan tombol Masuk / Daftar", () => {
    const headerPath = path.resolve(
      __dirname,
      "../src/components/layout/Header.tsx"
    );
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    // ThemeToggle component imported
    expect(headerContent).toContain("ThemeToggle");

    // Located adjacent to Masuk / Daftar in desktop view
    expect(headerContent).toContain('<ThemeToggle align="right" />');
    expect(headerContent).toContain("Masuk / Daftar");
  });

  it("AC 3: Desktop (Sudah Login) memiliki opsi tema di dalam Dropdown Profil Navbar di atas tombol Keluar", () => {
    const headerPath = path.resolve(
      __dirname,
      "../src/components/layout/Header.tsx"
    );
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    // Contains theme selector in profile dropdown
    expect(headerContent).toContain("Tema Tampilan");
    expect(headerContent).toContain("setTheme(\"light\")");
    expect(headerContent).toContain("setTheme(\"dark\")");
    expect(headerContent).toContain("setTheme(\"system\")");

    // Must be placed above the logout button
    const themeIndex = headerContent.indexOf("Tema Tampilan");
    const logoutIndex = headerContent.indexOf("Keluar Akun");
    expect(themeIndex).toBeGreaterThan(-1);
    expect(logoutIndex).toBeGreaterThan(-1);
    expect(themeIndex).toBeLessThan(logoutIndex);
  });

  it("AC 4: Mobile (Belum Login) memiliki opsi tema di bagian paling bawah Hamburger drawer menu", () => {
    const headerPath = path.resolve(
      __dirname,
      "../src/components/layout/Header.tsx"
    );
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    // Hamburger button present
    expect(headerContent).toContain('aria-label="Menu Navigasi Mobile"');
    expect(headerContent).toContain("isMobileDrawerOpen");

    // Theme options in drawer footer
    expect(headerContent).toContain("Tampilan Aplikasi");
    expect(headerContent).toContain("Terang");
    expect(headerContent).toContain("Gelap");
    expect(headerContent).toContain("Sistem");
  });

  it("AC 5: Mobile (Sudah Login) memiliki opsi tema interaktif di Halaman Profil di bawah Tampilan Aplikasi", () => {
    const profilPath = path.resolve(__dirname, "../src/app/profil/page.tsx");
    const profilContent = fs.readFileSync(profilPath, "utf-8");

    // Contains "Tampilan Aplikasi" section
    expect(profilContent).toContain("Tampilan Aplikasi");
    expect(profilContent).toContain("useTheme");
    expect(profilContent).toContain("Mode Terang");
    expect(profilContent).toContain("Mode Gelap");
    expect(profilContent).toContain("Ikuti Sistem");

    // Uses interactive radio button cards
    expect(profilContent).toContain("setTheme(\"light\")");
    expect(profilContent).toContain("setTheme(\"dark\")");
    expect(profilContent).toContain("setTheme(\"system\")");
  });

  it("AC 6: ThemeToggle component menyediakan opsi Light, Dark, System dengan state hydration aman", () => {
    const togglePath = path.resolve(
      __dirname,
      "../src/components/ui/ThemeToggle.tsx"
    );
    expect(fs.existsSync(togglePath)).toBe(true);
    const toggleContent = fs.readFileSync(togglePath, "utf-8");

    expect(toggleContent).toContain('"use client"');
    expect(toggleContent).toContain("useTheme");
    expect(toggleContent).toContain("mounted");
    expect(toggleContent).toContain("Terang");
    expect(toggleContent).toContain("Gelap");
    expect(toggleContent).toContain("Sistem");
  });
});
