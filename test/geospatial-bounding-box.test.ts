import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import {
  calculateBoundingBox,
  findPropertiesWithinRadius,
} from "../src/lib/propertyGeospatial";
import { clearDatabase } from "./helpers";

describe("Geospatial Haversine Bounding Box Pre-filter (Issue #442)", () => {
  describe("Unit: calculateBoundingBox()", () => {
    it("1. menghitung kotak pembatas (minLat, maxLat, minLng, maxLng) dengan akurat", () => {
      const lat = -6.57097; // Subang
      const lng = 107.76152;
      const radiusKm = 10;

      const bbox = calculateBoundingBox(lat, lng, radiusKm);

      expect(bbox.minLat).toBeLessThan(lat);
      expect(bbox.maxLat).toBeGreaterThan(lat);
      expect(bbox.minLng).toBeLessThan(lng);
      expect(bbox.maxLng).toBeGreaterThan(lng);

      // Delta latitude harus mendekati 10 / 111.045 ~ 0.09005 derajat
      const expectedLatDelta = 10 / 111.045;
      expect(bbox.maxLat - lat).toBeCloseTo(expectedLatDelta, 4);
      expect(lat - bbox.minLat).toBeCloseTo(expectedLatDelta, 4);

      // Delta longitude harus lebih besar dari delta latitude karena cos(lat) < 1
      const latDelta = bbox.maxLat - lat;
      const lngDelta = bbox.maxLng - lng;
      expect(lngDelta).toBeGreaterThan(latDelta);
    });

    it("2. menangani input radius 0 atau negatif secara aman (fallback safe radius)", () => {
      const bboxZero = calculateBoundingBox(-6.2, 106.8, 0);
      expect(bboxZero.maxLat).toBeGreaterThan(bboxZero.minLat);
      expect(bboxZero.maxLng).toBeGreaterThan(bboxZero.minLng);

      const bboxNeg = calculateBoundingBox(-6.2, 106.8, -5);
      expect(bboxNeg.maxLat).toBeGreaterThan(bboxNeg.minLat);
      expect(bboxNeg.maxLng).toBeGreaterThan(bboxNeg.minLng);
    });

    it("3. melindungi dari division by zero di kutub bumi (cos Lat mendekati 0)", () => {
      const bboxNorthPole = calculateBoundingBox(89.99, 0, 10);
      expect(Number.isFinite(bboxNorthPole.minLng)).toBe(true);
      expect(Number.isFinite(bboxNorthPole.maxLng)).toBe(true);
      expect(isNaN(bboxNorthPole.minLng)).toBe(false);
    });
  });

  describe("Validation: findPropertiesWithinRadius() input guard", () => {
    it("4. menolak koordinat invalid (NaN atau di luar batas bumi) secara aman", async () => {
      expect(await findPropertiesWithinRadius(NaN, 107.76, 10)).toEqual([]);
      expect(await findPropertiesWithinRadius(-6.57, NaN, 10)).toEqual([]);
      expect(await findPropertiesWithinRadius(95, 107.76, 10)).toEqual([]); // Lat > 90
      expect(await findPropertiesWithinRadius(-95, 107.76, 10)).toEqual([]); // Lat < -90
      expect(await findPropertiesWithinRadius(-6.57, 190, 10)).toEqual([]); // Lng > 180
      expect(await findPropertiesWithinRadius(-6.57, -190, 10)).toEqual([]); // Lng < -180
    });
  });

  describe("Integration: Database Query dengan Bounding Box Pre-filter", () => {
    beforeEach(async () => {
      await clearDatabase();
    });

    it("5. mengeksekusi query dan hanya mengembalikan kos yang berada di dalam radius & berstatus PUBLISHED", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Ibu Kos Subang",
          whatsapp_number: "081234567899",
        },
      });

      // Target pusat: Koordinat Terisolasi untuk testing (-7.5000, 110.5000)
      const targetLat = -7.5000;
      const targetLng = 110.5000;

      // Kos 1: Sangat dekat (~0.3 km) - PUBLISHED
      const kosDekat = await prisma.property.create({
        data: {
          name: "Kos Dekat Lokasi Uji",
          latitude: -7.502,
          longitude: 110.501,
          price_per_month: 800000,
          available_rooms: 3,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          status: "PUBLISHED",
          owner_id: owner.id,
        },
      });

      // Kos 2: Dalam radius (~2.5 km) - PUBLISHED
      const kosSedang = await prisma.property.create({
        data: {
          name: "Kos Nyaman Radius Uji",
          latitude: -7.515,
          longitude: 110.512,
          price_per_month: 900000,
          available_rooms: 2,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          status: "PUBLISHED",
          owner_id: owner.id,
        },
      });

      // Kos 3: Jauh di luar bounding box (~50 km) - PUBLISHED
      await prisma.property.create({
        data: {
          name: "Kos Luar Bounding Box (Jauh)",
          latitude: -7.80,
          longitude: 110.37,
          price_per_month: 1500000,
          available_rooms: 5,
          gender_type: "PUTRA",
          facilities: "Lengkap",
          status: "PUBLISHED",
          owner_id: owner.id,
        },
      });

      // Kos 4: Lokasi dekat tapi status DRAFT / PENDING_REVIEW (tidak boleh muncul)
      await prisma.property.create({
        data: {
          name: "Kos Belum Published",
          latitude: -7.501,
          longitude: 110.5005,
          price_per_month: 700000,
          available_rooms: 1,
          gender_type: "CAMPUR",
          facilities: "Kasur",
          status: "PENDING_REVIEW",
          owner_id: owner.id,
        },
      });

      // Jalankan pencarian radius 5 km
      const results = await findPropertiesWithinRadius(targetLat, targetLng, 5, 10);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe(kosDekat.id);
      expect(results[1].id).toBe(kosSedang.id);
      expect(results[0].distance).toBeLessThan(results[1].distance);
      expect(results[0].distance).toBeLessThanOrEqual(5);
      expect(results[1].distance).toBeLessThanOrEqual(5);

      // Verifikasi kos luar bounding box dan kos non-published tidak masuk
      const resultIds = results.map((r) => r.id);
      expect(resultIds).not.toContain("Kos Luar Bounding Box (Jauh)");
    });

    it("6. schema prisma terdefinisi dengan @@index([latitude, longitude])", () => {
      const schemaContent = fs.readFileSync(
        path.resolve(process.cwd(), "prisma/schema.prisma"),
        "utf-8"
      );
      expect(schemaContent).toContain("@@index([latitude, longitude])");
    });
  });
});
