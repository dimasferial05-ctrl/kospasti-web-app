import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  COMMON_LOCATION_COORDINATES,
  findCoordinateInDictionary,
} from "@/data/coordinates";
import {
  calculateHaversineDistanceKm,
  geocodeLocation,
} from "@/lib/geocoding";

describe("Geocoding & Coordinates Architecture & Dependency Tests", () => {
  it("1. src/lib/geocoding.ts tidak boleh mengimpor dari @/app/api/ai-search/route", () => {
    const geocodingPath = path.join(process.cwd(), "src", "lib", "geocoding.ts");
    const content = fs.readFileSync(geocodingPath, "utf-8");

    // Pastikan tidak ada impor dari route api
    expect(content).not.toContain("@/app/api/ai-search/route");
    expect(content).not.toContain("../app/api/ai-search/route");

    // Pastikan mengimpor dari @/data/coordinates
    expect(content).toContain("@/data/coordinates");
  });

  it("2. COMMON_LOCATION_COORDINATES dan findCoordinateInDictionary di src/data/coordinates.ts berfungsi akurat", () => {
    expect(COMMON_LOCATION_COORDINATES["polsub"]).toBeDefined();
    expect(COMMON_LOCATION_COORDINATES["alun-alun subang"]).toBeDefined();

    const matchPolsub = findCoordinateInDictionary("dekat polsub cibogo dong");
    expect(matchPolsub).not.toBeNull();
    expect(matchPolsub?.lat).toBeCloseTo(-6.5615, 2);

    const matchNull = findCoordinateInDictionary("tempat antah berantah tidak ada");
    expect(matchNull).toBeNull();
  });

  it("3. geocodeLocation di src/lib/geocoding.ts menggunakan kamus koordinat lokal dengan benar", async () => {
    const res = await geocodeLocation("Polsub");
    expect(res).not.toBeNull();
    expect(res?.source).toBe("dictionary");
    expect(res?.lat).toBeCloseTo(-6.5615, 2);
  });

  it("4. calculateHaversineDistanceKm menghitung jarak antar titik koordinat secara presisi", () => {
    // Jarak Polsub Cibogo ke Alun-alun Subang ~7-9 km
    const polsub = COMMON_LOCATION_COORDINATES["polsub cibogo"];
    const alunAlun = COMMON_LOCATION_COORDINATES["alun-alun subang"];

    const distance = calculateHaversineDistanceKm(
      polsub.lat,
      polsub.lng,
      alunAlun.lat,
      alunAlun.lng
    );

    expect(distance).toBeGreaterThan(6);
    expect(distance).toBeLessThan(11);
  });

  it("5. src/app/api/ai-search/route.ts berhasil me-re-export COMMON_LOCATION_COORDINATES untuk backward compatibility", async () => {
    const routeModule = await import("@/app/api/ai-search/route");
    expect(routeModule.COMMON_LOCATION_COORDINATES).toBeDefined();
    expect(routeModule.findCoordinateInDictionary).toBeDefined();
    expect(typeof routeModule.findCoordinateInDictionary).toBe("function");
  });
});
