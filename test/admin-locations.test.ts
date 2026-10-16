import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Admin Locations Management & Feature #253", () => {
  it("memiliki rute halaman admin locations di src/app/admin/locations/page.tsx", () => {
    const pagePath = path.resolve(__dirname, "../src/app/admin/locations/page.tsx");
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Kelola Master Lokasi Subang");
    expect(content).toContain("LocationPicker");
    expect(content).toContain("Tambah Lokasi");
    expect(content).toContain("Hapus Lokasi");
  });

  it("mendaftarkan navigasi Kelola Lokasi di sidebar admin layout", () => {
    const layoutPath = path.resolve(__dirname, "../src/app/admin/layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    expect(content).toContain('label: "Kelola Lokasi"');
    expect(content).toContain('href: "/admin/locations"');
    expect(content).toContain("MapPin");
  });

  it("memiliki model Location di prisma/schema.prisma", () => {
    const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
    const content = fs.readFileSync(schemaPath, "utf-8");

    expect(content).toContain("model Location");
    expect(content).toContain("latitude");
    expect(content).toContain("longitude");
    expect(content).toContain("aliases");
    expect(content).toContain("subdistrict");
    expect(content).toContain("is_active");
  });

  it("memiliki API route handler untuk admin locations", () => {
    const apiRoutePath = path.resolve(__dirname, "../src/app/api/admin/locations/route.ts");
    const apiDetailPath = path.resolve(__dirname, "../src/app/api/admin/locations/[id]/route.ts");

    expect(fs.existsSync(apiRoutePath)).toBe(true);
    expect(fs.existsSync(apiDetailPath)).toBe(true);

    const routeContent = fs.readFileSync(apiRoutePath, "utf-8");
    expect(routeContent).toContain("verifyAdmin");
    expect(routeContent).toContain("admin_token");
    expect(routeContent).toContain("prisma.location");
  });

  it("memvalidasi data input lokasi: nama minimal 2 karakter", () => {
    const validateName = (name: string) => typeof name === "string" && name.trim().length >= 2;
    expect(validateName("A")).toBe(false);
    expect(validateName("  ")).toBe(false);
    expect(validateName("SMK PGRI 1 Subang")).toBe(true);
  });

  it("memvalidasi koordinat latitude dan longitude dalam rentang valid", () => {
    const validateCoords = (lat: number, lng: number) =>
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    // Titik Subang
    expect(validateCoords(-6.559, 107.7583)).toBe(true);
    // Nilai tidak valid
    expect(validateCoords(100, 107.7583)).toBe(false);
    expect(validateCoords(-6.559, 200)).toBe(false);
    expect(validateCoords(NaN, 107)).toBe(false);
  });

  it("memformat aliases koma menjadi array kata kunci bersih", () => {
    const raw = "smeri, Tubun ,  smk tubun ";
    const parsed = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    expect(parsed).toEqual(["smeri", "tubun", "smk tubun"]);
  });
});
