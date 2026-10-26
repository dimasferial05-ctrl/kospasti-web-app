import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Accessibility: Reduced Motion Support (Issue continuous float)", () => {
  it("globals.css mendefinisikan media query prefers-reduced-motion untuk mematikan animate-float dan animasi kontinu lainnya", () => {
    const cssPath = path.resolve(__dirname, "../src/app/globals.css");
    const content = fs.readFileSync(cssPath, "utf-8");

    expect(content).toContain("prefers-reduced-motion: reduce");
    expect(content).toContain(".animate-float");
    expect(content).toContain("animation: none !important");
  });

  it("RoleCardsSection bebas dari animasi melayang kontinu (animate-float / animate-float-slow)", () => {
    const filePath = path.resolve(__dirname, "../src/components/landing/RoleCardsSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain("animate-float");
    expect(content).not.toContain("animate-float-slow");
  });

  it("HowItWorksSection bebas dari animasi melayang kontinu (animate-float)", () => {
    const filePath = path.resolve(__dirname, "../src/components/landing/HowItWorksSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain("animate-float");
  });
});
