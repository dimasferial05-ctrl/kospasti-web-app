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

  it("RoleCardsSection menyertakan utility motion-reduce:animate-none pada kedua kartu", () => {
    const filePath = path.resolve(__dirname, "../src/components/landing/RoleCardsSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("animate-float motion-reduce:animate-none");
    expect(content).toContain("animate-float-slow motion-reduce:animate-none");
  });

  it("HowItWorksSection menyertakan utility motion-reduce:animate-none pada floating smartphone mockup", () => {
    const filePath = path.resolve(__dirname, "../src/components/landing/HowItWorksSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain("animate-float motion-reduce:animate-none");
  });
});
