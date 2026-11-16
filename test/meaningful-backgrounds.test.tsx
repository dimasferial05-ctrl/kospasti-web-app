import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import {
  TopographicGlow,
  ArchitecturalGrid,
  TrustAura,
  RadarEmptyPattern,
} from "../src/components/ui/backgrounds";

describe("Meaningful Backgrounds (Anti-Slop Implementation)", () => {
  const rootDir = path.resolve(__dirname, "..");

  it("renders TopographicGlow with aria-hidden, pointer-events-none, and SVG paths", () => {
    const html = renderToStaticMarkup(<TopographicGlow />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("<svg");
    expect(html).toContain("<path");
  });

  it("renders ArchitecturalGrid with default and dark variants", () => {
    // Default variant
    const defaultHtml = renderToStaticMarkup(<ArchitecturalGrid />);
    expect(defaultHtml).toContain('aria-hidden="true"');
    expect(defaultHtml).toContain('id="architectural-grid-default"');

    // Dark variant
    const darkHtml = renderToStaticMarkup(<ArchitecturalGrid variant="dark" />);
    expect(darkHtml).toContain('aria-hidden="true"');
    expect(darkHtml).toContain('id="architectural-grid-dark"');
  });

  it("renders TrustAura with radial glow and concentric security watermark rings", () => {
    const html = renderToStaticMarkup(<TrustAura />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("<circle");
    expect(html).toContain('stroke-dasharray="4 6"');
  });

  it("renders RadarEmptyPattern with concentric search radar rings and crosshairs", () => {
    const html = renderToStaticMarkup(<RadarEmptyPattern />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("<circle");
    expect(html).toContain("<line");
    expect(html).toContain('stroke-dasharray="4 6"');
  });

  it("passes custom className properly across all background components", () => {
    const customClass = "custom-bg-test-class";
    const topoHtml = renderToStaticMarkup(<TopographicGlow className={customClass} />);
    const archHtml = renderToStaticMarkup(<ArchitecturalGrid className={customClass} />);
    const trustHtml = renderToStaticMarkup(<TrustAura className={customClass} />);
    const radarHtml = renderToStaticMarkup(<RadarEmptyPattern className={customClass} />);

    expect(topoHtml).toContain(customClass);
    expect(archHtml).toContain(customClass);
    expect(trustHtml).toContain(customClass);
    expect(radarHtml).toContain(customClass);
  });

  it("memastikan HeroSection telah mengimpor dan memasang TopographicGlow", () => {
    const heroPath = path.join(rootDir, "src/components/landing/HeroSection.tsx");
    const heroContent = fs.readFileSync(heroPath, "utf-8");

    expect(heroContent).toContain('import { TopographicGlow } from "@/components/ui/backgrounds"');
    expect(heroContent).toContain("<TopographicGlow />");
  });

  it("memastikan halaman Auth (login, partner login, partner register) telah memasang ArchitecturalGrid", () => {
    const loginPath = path.join(rootDir, "src/app/login/page.tsx");
    const partnerLoginPath = path.join(rootDir, "src/app/partner/login/page.tsx");
    const partnerRegisterPath = path.join(rootDir, "src/app/partner/register/page.tsx");

    const loginContent = fs.readFileSync(loginPath, "utf-8");
    const partnerLoginContent = fs.readFileSync(partnerLoginPath, "utf-8");
    const partnerRegisterContent = fs.readFileSync(partnerRegisterPath, "utf-8");

    expect(loginContent).toContain("<ArchitecturalGrid />");
    expect(partnerLoginContent).toContain("<ArchitecturalGrid />");
    expect(partnerRegisterContent).toContain("<ArchitecturalGrid />");
  });

  it("memastikan PartnerCTASection telah memasang ArchitecturalGrid variant dark", () => {
    const partnerCtaPath = path.join(rootDir, "src/components/landing/PartnerCTASection.tsx");
    const content = fs.readFileSync(partnerCtaPath, "utf-8");

    expect(content).toContain('<ArchitecturalGrid variant="dark" />');
  });

  it("memastikan halaman sukses dan receipt telah memasang TrustAura", () => {
    const successPath = path.join(rootDir, "src/app/success/[bookingId]/page.tsx");
    const receiptPath = path.join(rootDir, "src/app/receipt/[bookingId]/page.tsx");

    const successContent = fs.readFileSync(successPath, "utf-8");
    const receiptContent = fs.readFileSync(receiptPath, "utf-8");

    expect(successContent).toContain("<TrustAura />");
    expect(receiptContent).toContain("<TrustAura");
  });

  it("memastikan empty state di halaman search dan map telah memasang RadarEmptyPattern", () => {
    const searchPath = path.join(rootDir, "src/app/search/page.tsx");
    const mapPath = path.join(rootDir, "src/app/map/page.tsx");

    const searchContent = fs.readFileSync(searchPath, "utf-8");
    const mapContent = fs.readFileSync(mapPath, "utf-8");

    expect(searchContent).toContain("<RadarEmptyPattern />");
    expect(mapContent).toContain("<RadarEmptyPattern />");
  });
});
