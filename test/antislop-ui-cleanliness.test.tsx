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

  it("memastikan admin login bebas dari glow orbs blur-3xl dan gradien indigo klise (#356)", () => {
    const adminLoginPath = path.join(rootDir, "src/app/admin/login/page.tsx");
    const content = fs.readFileSync(adminLoginPath, "utf-8");

    expect(content).not.toContain("blur-3xl");
    expect(content).not.toContain("to-indigo-950");
    expect(content).not.toContain("from-blue-600 via-indigo-600");
    expect(content).toContain("bg-slate-50");
    expect(content).toContain("bg-emerald-600");
  });

  it("memastikan search page bebas dari TypeAnimation (#356)", () => {
    const searchPath = path.join(rootDir, "src/app/search/page.tsx");
    const content = fs.readFileSync(searchPath, "utf-8");

    expect(content).not.toContain("TypeAnimation");
    expect(content).not.toContain("repeat={Infinity}");
  });

  it("memastikan MapViewer dan map/page bebas dari ikon Sparkles (#356)", () => {
    const mapViewerPath = path.join(rootDir, "src/components/map/MapViewer.tsx");
    const mapPagePath = path.join(rootDir, "src/app/map/page.tsx");

    const mapViewerContent = fs.readFileSync(mapViewerPath, "utf-8");
    const mapPageContent = fs.readFileSync(mapPagePath, "utf-8");

    expect(mapViewerContent).not.toContain("Sparkles");
    expect(mapViewerContent).toContain("Compass");
    expect(mapPageContent).not.toContain("Sparkles");
    expect(mapPageContent).toContain("PawPrint");
  });

  it("memastikan LocationPicker bebas dari animate-bounce (#356)", () => {
    const pickerPath = path.join(rootDir, "src/components/map/LocationPicker.tsx");
    const content = fs.readFileSync(pickerPath, "utf-8");

    expect(content).not.toContain("animate-bounce");
    expect(content).not.toContain("📍 Titik Kos");
  });

  it("memastikan halaman detail kos bebas dari decorative status dots pada heading (#356)", () => {
    const kosDetailPath = path.join(rootDir, "src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(kosDetailPath, "utf-8");

    expect(content).not.toContain('span className="w-2.5 h-2.5 rounded-full bg-emerald-600"');
    expect(content).not.toContain('span className="w-2.5 h-2.5 rounded-full bg-teal-600"');
    expect(content).not.toContain('span className="w-2.5 h-2.5 rounded-full bg-emerald-500"');
    expect(content).not.toContain('span className="w-2.5 h-2.5 rounded-full bg-amber-500"');
    expect(content).not.toContain('span className="w-2.5 h-2.5 rounded-full bg-blue-600"');
  });

  it("memastikan HowItWorksSection nomor langkah tidak menggunakan font-mono (#356)", () => {
    const howPath = path.join(rootDir, "src/components/landing/HowItWorksSection.tsx");
    const content = fs.readFileSync(howPath, "utf-8");

    expect(content).not.toMatch(/step\.number[\s\S]*font-mono/);
    expect(content).toContain("text-emerald-600 dark:text-emerald-400 shrink-0 leading-none group-hover:scale-110");
  });

  it("memastikan modal detail user di admin bookings tidak menggunakan gradien blue-indigo (#356)", () => {
    const bookingsPath = path.join(rootDir, "src/app/admin/bookings/page.tsx");
    const content = fs.readFileSync(bookingsPath, "utf-8");

    expect(content).not.toContain("bg-gradient-to-r from-blue-600 to-indigo-600");
    expect(content).toContain("bg-gradient-to-r from-slate-900 to-slate-800");
  });

  it("memastikan admin locations menggunakan ikon semantik bukan emoji mentah (#358)", () => {
    const locationsPath = path.join(rootDir, "src/app/admin/locations/page.tsx");
    const content = fs.readFileSync(locationsPath, "utf-8");

    expect(content).not.toContain('icon: "🎓"');
    expect(content).not.toContain('icon: "🏫"');
    expect(content).not.toContain('icon: "🏥"');
    expect(content).not.toContain('icon: "📍"');
    expect(content).toContain("GraduationCap");
    expect(content).toContain("School");
    expect(content).toContain("HeartPulse");
    expect(content).toContain("Compass");
  });

  it("memastikan rating mini bar di partner reviews tidak menggunakan karakter bintang teks (#358)", () => {
    const reviewsPath = path.join(rootDir, "src/app/partner/dashboard/reviews/page.tsx");
    const content = fs.readFileSync(reviewsPath, "utf-8");

    expect(content).not.toContain("{ratingVal}★");
    expect(content).toContain("Star");
  });

  it("memastikan MapViewer bebas dari animate-ping (#358)", () => {
    const mapViewerPath = path.join(rootDir, "src/components/map/MapViewer.tsx");
    const content = fs.readFileSync(mapViewerPath, "utf-8");

    expect(content).not.toContain("animate-ping");
  });

  it("memastikan CheckCircle2 di halaman sukses bebas dari animate-bounce-short (#358)", () => {
    const successPath = path.join(rootDir, "src/app/success/[bookingId]/page.tsx");
    const content = fs.readFileSync(successPath, "utf-8");

    expect(content).not.toContain("animate-bounce-short");
  });

  it("memastikan link di HeroSection dan search page bebas dari panah literal (#358)", () => {
    const heroPath = path.join(rootDir, "src/components/landing/HeroSection.tsx");
    const searchPath = path.join(rootDir, "src/app/search/page.tsx");

    const heroContent = fs.readFileSync(heroPath, "utf-8");
    const searchContent = fs.readFileSync(searchPath, "utf-8");

    expect(heroContent).not.toContain("Buka Peta Kos →");
    expect(heroContent).toContain("Buka Peta Kos");
    expect(searchContent).not.toContain("Buka Peta Interaktif →");
    expect(searchContent).toContain("Buka Peta Interaktif");
  });

  it("memastikan KosPropertyCard bebas dari decorative status dot (#358)", () => {
    const cardPath = path.join(rootDir, "src/components/features/KosPropertyCard.tsx");
    const content = fs.readFileSync(cardPath, "utf-8");

    expect(content).not.toContain('span className="w-1.5 h-1.5 rounded-full bg-emerald-400"');
  });

  it("memastikan help center tidak menggunakan ikon Zap klise (#358)", () => {
    const helpDataPath = path.join(rootDir, "src/lib/data/help-center.ts");
    const bantuanPagePath = path.join(rootDir, "src/app/bantuan/page.tsx");

    const helpContent = fs.readFileSync(helpDataPath, "utf-8");
    const bantuanContent = fs.readFileSync(bantuanPagePath, "utf-8");

    expect(helpContent).not.toContain('iconName: "Zap"');
    expect(helpContent).toContain('iconName: "Smartphone"');
    expect(bantuanContent).not.toContain('case "Zap":');
    expect(bantuanContent).toContain('case "Smartphone":');
  });
});
