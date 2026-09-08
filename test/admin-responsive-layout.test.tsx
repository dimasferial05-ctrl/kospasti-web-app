import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import AdminLayout from "../src/app/admin/layout";

// Mock next/navigation
let mockPathname = "/admin";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Responsive Admin Dashboard Layout & CRUD Tables (Issue #104)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/admin";
  });

  describe("Admin Layout Responsiveness", () => {
    it("memiliki mobile header dengan toggle hamburger menu pada layar kecil (md:hidden)", () => {
      const html = renderToStaticMarkup(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      // Mobile header ada di markup
      expect(html).toContain("KosPasti");
      expect(html).toContain("ADMIN");
      expect(html).toContain("md:hidden");
      expect(html).toContain("fixed w-full top-0");
    });

    it("memiliki class sidebar responsif dengan transisi dan md:translate-x-0", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("-translate-x-full md:translate-x-0");
      expect(content).toContain("transition-transform duration-300");
      expect(content).toContain("isMobileMenuOpen");
    });

    it("memiliki kontainer main dengan margin dan padding responsif (md:ml-64 p-4 md:p-8 mt-14 md:mt-0)", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("md:ml-64");
      expect(content).toContain("p-4 md:p-8");
      expect(content).toContain("mt-14 md:mt-0");
    });
  });

  describe("CRUD Tables Horizontal Scroll & Min-Width", () => {
    it("memastikan tabel pada Halaman Pemilik (/admin/owners) memiliki wrapper overflow-x-auto dan min-w-[800px]", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/owners/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("overflow-x-auto");
      expect(content).toContain('table className="w-full text-left text-sm min-w-[800px]"');
    });

    it("memastikan tabel pada Halaman Properti (/admin/properties) memiliki wrapper overflow-x-auto dan min-w-[800px]", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/properties/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("overflow-x-auto");
      expect(content).toContain('table className="w-full text-left text-sm min-w-[800px]"');
    });

    it("memastikan tabel pada Halaman Transaksi (/admin/bookings) memiliki wrapper overflow-x-auto dan min-w-[800px]", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/bookings/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("overflow-x-auto");
      expect(content).toContain('table className="w-full text-left text-sm min-w-[800px]"');
    });
  });
});
