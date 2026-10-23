import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Profile Page WAI-ARIA Tab Accessibility Tests (Issue #346)", () => {
  const profileFilePath = path.resolve(__dirname, "../src/app/profil/page.tsx");
  const content = fs.readFileSync(profileFilePath, "utf-8");

  it("memiliki wadah navigasi dengan role tablist dan aria-label", () => {
    expect(content).toContain('role="tablist"');
    expect(content).toContain('aria-label="Menu Tab Profil"');
  });

  it("menyediakan atribut role tab, id, aria-selected, dan aria-controls pada tombol Data Diri", () => {
    expect(content).toContain('role="tab"');
    expect(content).toContain('id="tab-profile"');
    expect(content).toContain('aria-selected={activeTab === "profile"}');
    expect(content).toContain('aria-controls="panel-profile"');
  });

  it("menyediakan atribut role tab, id, aria-selected, dan aria-controls pada tombol Riwayat Pesanan", () => {
    expect(content).toContain('id="tab-bookings"');
    expect(content).toContain('aria-selected={activeTab === "bookings"}');
    expect(content).toContain('aria-controls="panel-bookings"');
  });

  it("menyediakan semantik role tabpanel, id, aria-labelledby, dan tabIndex pada kedua panel konten", () => {
    expect(content).toContain('role="tabpanel"');
    expect(content).toContain('id="panel-profile"');
    expect(content).toContain('aria-labelledby="tab-profile"');

    expect(content).toContain('id="panel-bookings"');
    expect(content).toContain('aria-labelledby="tab-bookings"');
    expect(content).toContain("tabIndex={0}");
  });

  it("menerapkan focus ring focus-visible ring-emerald-500 pada tombol tab", () => {
    expect(content).toContain("focus-visible:ring-emerald-500");
  });

  it("memastikan tombol Keluar Akun tetap berupa aksi button biasa tanpa role tab", () => {
    // Tombol logout tidak boleh memiliki role="tab"
    const logoutMatch = content.match(/onClick=\{handleLogout\}[\s\S]*?>/);
    expect(logoutMatch).not.toBeNull();
    if (logoutMatch) {
      expect(logoutMatch[0]).not.toContain('role="tab"');
    }
  });
});
