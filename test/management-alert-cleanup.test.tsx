import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Management & Verification Alert Cleanup (Issue #336)", () => {
  const targetFiles = [
    "src/app/partner/dashboard/properties/page.tsx",
    "src/app/admin/properties/page.tsx",
    "src/app/admin/owners/page.tsx",
    "src/app/admin/locations/page.tsx",
    "src/app/admin/bookings/page.tsx",
    "src/app/update/[token]/page.tsx",
    "src/app/booking/verify/[token]/page.tsx",
  ];

  targetFiles.forEach((relPath) => {
    it(`tidak ada lagi pemanggilan alert(...) di file ${relPath}`, () => {
      const fullPath = path.resolve(__dirname, "..", relPath);
      const content = fs.readFileSync(fullPath, "utf-8");

      // Pastikan tidak ada pemanggilan native alert(...)
      // Regex memastikan mencari fungsi alert(...) bukan setStatusAlert dsb.
      const alertMatches = content.match(/\balert\s*\(/g);
      expect(alertMatches).toBeNull();
    });

    it(`menyediakan notifikasi error dengan atribut aksesibilitas role="alert" dan aria-live="assertive" di ${relPath}`, () => {
      const fullPath = path.resolve(__dirname, "..", relPath);
      const content = fs.readFileSync(fullPath, "utf-8");

      expect(content).toContain('role="alert"');
      expect(content).toContain('aria-live="assertive"');
    });

    it(`menyediakan tombol dismiss dengan aria-label="Tutup pesan error" di ${relPath}`, () => {
      const fullPath = path.resolve(__dirname, "..", relPath);
      const content = fs.readFileSync(fullPath, "utf-8");

      expect(content).toContain('aria-label="Tutup pesan error"');
    });
  });
});
