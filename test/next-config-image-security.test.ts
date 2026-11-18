import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Next.js Image Security & Remote Patterns Configuration (Issue #418)", () => {
  const configPath = path.resolve(__dirname, "../next.config.ts");
  const rawContent = fs.readFileSync(configPath, "utf-8");

  describe("1. Pencegahan Celah SSRF & Wildcard Elimination", () => {
    it("tidak mengizinkan wildcard '**' pada konfigurasi hostname gambar", () => {
      // Memastikan string `hostname: "**"` atau `hostname: '**'` tidak ada
      expect(rawContent).not.toMatch(/hostname:\s*["']\*\*["']/);
      expect(rawContent).not.toMatch(/hostname:\s*["']\*["']/);
    });

    it("tidak mengizinkan protokol HTTP tidak aman pada remotePatterns", () => {
      // Memastikan tidak ada protocol: "http" di dalam remotePatterns
      const remotePatternsBlockMatch = rawContent.match(/remotePatterns:\s*\[([\s\S]*?)\]/);
      expect(remotePatternsBlockMatch).not.toBeNull();

      const remotePatternsBlock = remotePatternsBlockMatch![1];
      expect(remotePatternsBlock).not.toMatch(/protocol:\s*["']http["']/);
    });
  });

  describe("2. Validasi Whitelist Domain Resmi KosPasti", () => {
    it("hanya mendaftarkan domain resmi dengan protokol HTTPS yang aman", () => {
      const remotePatternsBlockMatch = rawContent.match(/remotePatterns:\s*\[([\s\S]*?)\]/);
      expect(remotePatternsBlockMatch).not.toBeNull();
      const block = remotePatternsBlockMatch![1];

      // Domain resmi yang wajib terdaftar:
      expect(block).toContain("*.supabase.co");
      expect(block).toContain("rghnaikrurcwctqxdsjo.supabase.co");
      expect(block).toContain("images.unsplash.com");
      expect(block).toContain("lh3.googleusercontent.com");
      expect(block).toContain("*.googleusercontent.com");
    });

    it("memastikan seluruh item di remotePatterns memiliki protocol: 'https'", () => {
      const remotePatternsBlockMatch = rawContent.match(/remotePatterns:\s*\[([\s\S]*?)\]/);
      const block = remotePatternsBlockMatch![1];

      // Ekstraksi tiap objek remote pattern
      const patternObjects = block.split(/\},?\s*\{/);
      expect(patternObjects.length).toBeGreaterThanOrEqual(4);

      for (const pattern of patternObjects) {
        expect(pattern).toContain('protocol: "https"');
      }
    });
  });
});
