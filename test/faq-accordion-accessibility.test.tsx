import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("FAQ Accordion Keyboard Focus Accessibility (WCAG 2.4.7)", () => {
  const faqComponentPath = path.resolve(
    __dirname,
    "../src/components/landing/FAQSection.tsx"
  );
  const content = fs.readFileSync(faqComponentPath, "utf-8");

  it("tidak lagi menghilangkan indikator fokus dengan focus:outline-hidden", () => {
    expect(content).not.toContain("focus:outline-hidden");
  });

  it("menerapkan utility focus-visible ring dengan warna emerald dan offset yang sesuai", () => {
    expect(content).toContain("focus-visible:outline-none");
    expect(content).toContain("focus-visible:ring-2");
    expect(content).toContain("focus-visible:ring-emerald-500");
    expect(content).toContain("focus-visible:ring-offset-2");
    expect(content).toContain("dark:focus-visible:ring-offset-slate-900");
    expect(content).toContain("rounded-2xl");
  });

  it("mempertahankan atribut aksesibilitas aria-expanded pada tombol accordion", () => {
    expect(content).toContain("aria-expanded={isOpen}");
  });

  it("memastikan tombol accordion memiliki class focus ring yang lengkap dan teratur", () => {
    expect(content).toMatch(
      /className="[^"]*focus-visible:outline-none[^"]*focus-visible:ring-2[^"]*focus-visible:ring-emerald-500[^"]*focus-visible:ring-offset-2[^"]*dark:focus-visible:ring-offset-slate-900[^"]*rounded-2xl[^"]*"/
    );
  });
});
