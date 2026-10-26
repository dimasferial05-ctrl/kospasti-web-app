import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Anti-Slop UI Cleanliness Verification (Issue #354)", () => {
  const rootDir = path.resolve(__dirname, "..");

  it("memastikan seluruh komponen dead code & shader canvas telah dihapus", () => {
    const deletedFiles = [
      "src/components/ui/isoline-bloom.tsx",
      "src/components/ui/animated-gradient.tsx",
      "src/components/ui/gooey-input.tsx",
      "src/components/ui/aurora-background.tsx",
      "src/components/ui/gradient-wave.tsx",
    ];

    deletedFiles.forEach((relPath) => {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath)).toBe(false);
    });
  });

  it("memastikan title metadata di layout.tsx dan page.tsx tidak mengandung emoji rumah (🏠)", () => {
    const layoutPath = path.join(rootDir, "src/app/layout.tsx");
    const pagePath = path.join(rootDir, "src/app/page.tsx");

    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(layoutContent).not.toContain("🏠");
    expect(pageContent).not.toContain("🏠");
    expect(layoutContent).toContain('title: "KosPasti - Kepastian Kos Real-Time"');
  });

  it("memastikan Header.tsx tidak memiliki emoji (🏠, 🗺️) dan navigasi bebas dari icon AI klise", () => {
    const headerPath = path.join(rootDir, "src/components/layout/Header.tsx");
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    expect(headerContent).not.toContain('<span className="sr-only">🏠</span>');
    expect(headerContent).toContain('<span className="sr-only">Beranda KosPasti</span>');
    expect(headerContent).not.toContain("🗺️");
    expect(headerContent).not.toContain("icon: Zap");
    expect(headerContent).not.toContain("icon: Sparkles");
  });

  it("memastikan fasilitas Pet Friendly menggunakan PawPrint, bukan Sparkles", () => {
    const kosDetailPath = path.join(rootDir, "src/app/kos/[id]/page.tsx");
    const adminPropsPath = path.join(rootDir, "src/app/admin/properties/page.tsx");
    const partnerPropsPath = path.join(rootDir, "src/app/partner/dashboard/properties/page.tsx");

    const kosDetail = fs.readFileSync(kosDetailPath, "utf-8");
    const adminProps = fs.readFileSync(adminPropsPath, "utf-8");
    const partnerProps = fs.readFileSync(partnerPropsPath, "utf-8");

    expect(kosDetail).toContain("<PawPrint");
    expect(adminProps).toContain("<PawPrint");
    expect(partnerProps).toContain("<PawPrint");
  });

  it("memastikan HeroSection bebas dari WebGL shader canvas dan looping TypeAnimation", () => {
    const heroPath = path.join(rootDir, "src/components/landing/HeroSection.tsx");
    const heroContent = fs.readFileSync(heroPath, "utf-8");

    expect(heroContent).not.toContain("GradientWave");
    expect(heroContent).not.toContain("TypeAnimation");
  });

  it("memastikan HowItWorksSection bebas dari fake browser window (traffic lights) dan emoji kunci", () => {
    const howItWorksPath = path.join(rootDir, "src/components/landing/HowItWorksSection.tsx");
    const content = fs.readFileSync(howItWorksPath, "utf-8");

    expect(content).not.toContain("🔒");
    expect(content).not.toContain("bg-rose-500");
    expect(content).not.toContain("bg-amber-500");
  });

  it("memastikan LandingFooter tidak memiliki tautan mati cursor-not-allowed", () => {
    const footerPath = path.join(rootDir, "src/components/landing/LandingFooter.tsx");
    const content = fs.readFileSync(footerPath, "utf-8");

    expect(content).not.toContain("cursor-not-allowed");
  });

  it("memastikan status dot pada dashboard mitra tidak menggunakan animate-pulse", () => {
    const partnerPropsPath = path.join(rootDir, "src/app/partner/dashboard/properties/page.tsx");
    const content = fs.readFileSync(partnerPropsPath, "utf-8");

    expect(content).not.toMatch(/rounded-full bg-emerald-500 animate-pulse/);
    expect(content).not.toMatch(/rounded-full bg-amber-500 animate-pulse/);
  });
});
