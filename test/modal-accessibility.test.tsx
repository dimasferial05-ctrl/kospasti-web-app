import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileCompletionModal } from "../src/components/features/ProfileCompletionModal";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Modal Accessibility & Focus Trap - Issue #320", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Custom Hook: src/hooks/useFocusTrap.ts", () => {
    it("memiliki file hook useFocusTrap yang mengekspor fungsi dengan benar", () => {
      const hookPath = path.resolve(__dirname, "../src/hooks/useFocusTrap.ts");
      expect(fs.existsSync(hookPath)).toBe(true);

      const content = fs.readFileSync(hookPath, "utf-8");
      expect(content).toContain("export function useFocusTrap");
      expect(content).toContain("e.key === \"Escape\"");
      expect(content).toContain("e.key === \"Tab\"");
      expect(content).toContain("e.shiftKey");
    });

    it("memiliki logika pembersihan event listener dan pengembalian fokus (restore focus)", () => {
      const hookPath = path.resolve(__dirname, "../src/hooks/useFocusTrap.ts");
      const content = fs.readFileSync(hookPath, "utf-8");

      expect(content).toContain("removeEventListener(\"keydown\", handleKeyDown)");
      expect(content).toContain("previousActiveElementRef");
    });
  });

  describe("2. Modal Detail Kos: src/app/kos/[id]/page.tsx", () => {
    const pagePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    it("mengimpor useFocusTrap", () => {
      expect(content).toContain("useFocusTrap");
      expect(content).toContain("@/hooks/useFocusTrap");
    });

    it("memiliki atribut ARIA semantik pada modal pemesanan (role, aria-modal, aria-labelledby)", () => {
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('aria-labelledby="booking-modal-title"');
      expect(content).toContain('id="booking-modal-title"');
      expect(content).toContain('ref={bookingModalRef}');
    });

    it("memiliki atribut ARIA semantik pada modal pending booking", () => {
      expect(content).toContain('aria-labelledby="pending-booking-title"');
      expect(content).toContain('id="pending-booking-title"');
      expect(content).toContain('ref={pendingModalRef}');
    });
  });

  describe("3. Modal Kelengkapan WhatsApp: src/components/features/ProfileCompletionModal.tsx", () => {
    const componentPath = path.resolve(
      __dirname,
      "../src/components/features/ProfileCompletionModal.tsx"
    );
    const content = fs.readFileSync(componentPath, "utf-8");

    it("mengimpor useFocusTrap", () => {
      expect(content).toContain("useFocusTrap");
      expect(content).toContain("@/hooks/useFocusTrap");
    });

    it("memiliki atribut ARIA semantik (role dialog, aria-modal, aria-labelledby)", () => {
      expect(content).toContain('role="dialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('aria-labelledby="profile-modal-title"');
      expect(content).toContain('id="profile-modal-title"');
      expect(content).toContain('ref={modalRef}');
    });

    it("komponen tidak merender modal jika isOpen false", () => {
      // Mock global fetch agar tidak throw
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authenticated: false }),
      } as unknown as Response);

      const html = renderToStaticMarkup(<ProfileCompletionModal />);
      expect(html).toBe("");
    });
  });
});
