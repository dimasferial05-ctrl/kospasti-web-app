import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as getNearbyLocations } from "@/app/api/locations/nearby/route";
import CampusCommuteEstimator from "@/components/features/CampusCommuteEstimator";
import KosPropertyCard from "@/components/features/KosPropertyCard";

describe("Campus Commute & Distance Estimator - Issue #378", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("API: GET /api/locations/nearby", () => {
    it("mengembalikan status 400 jika parameter lat atau lng tidak disediakan", async () => {
      const req = new NextRequest("http://localhost:3000/api/locations/nearby");
      const res = await getNearbyLocations(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Parameter lat dan lng harus disediakan");
    });

    it("mengembalikan status 400 jika lat atau lng bukan angka valid", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/locations/nearby?lat=abc&lng=def"
      );
      const res = await getNearbyLocations(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Parameter lat dan lng harus berupa angka");
    });

    it("mengembalikan daftar lokasi terdekat dengan format durasi dan jarak yang benar", async () => {
      // Koordinat di area Subang dekat Polsub / UPI Subang
      const req = new NextRequest(
        "http://localhost:3000/api/locations/nearby?lat=-6.5682&lng=107.7612&limit=5"
      );
      const res = await getNearbyLocations(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      const first = data.data[0];
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("distanceKm");
      expect(first).toHaveProperty("walkMinutes");
      expect(first).toHaveProperty("driveMinutes");
      expect(first).toHaveProperty("walkFormatted");
      expect(first).toHaveProperty("driveFormatted");
      expect(first).toHaveProperty("isWalkable");
      expect(typeof first.distanceKm).toBe("number");
      expect(typeof first.walkMinutes).toBe("number");
      expect(typeof first.driveMinutes).toBe("number");
    });

    it("mengurutkan lokasi terdekat secara ascending berdasarkan distanceKm", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/locations/nearby?lat=-6.5682&lng=107.7612&limit=5"
      );
      const res = await getNearbyLocations(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const list = data.data;
      for (let i = 0; i < list.length - 1; i++) {
        expect(list[i].distanceKm).toBeLessThanOrEqual(list[i + 1].distanceKm);
      }
    });

    it("mendukung filter kategori kampus", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/locations/nearby?lat=-6.5682&lng=107.7612&category=kampus&limit=3"
      );
      const res = await getNearbyLocations(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      data.data.forEach((item: { category: string }) => {
        expect(["kampus", "sekolah"]).toContain(item.category);
      });
    });
  });

  describe("UI Component: CampusCommuteEstimator", () => {
    it("tidak merender apa-apa (null) jika koordinat null atau 0", () => {
      const html = renderToStaticMarkup(
        <CampusCommuteEstimator
          propertyName="Kos Mawar"
          propertyLat={null}
          propertyLng={null}
        />
      );
      expect(html).toBe("");
    });

    it("merender wadah utama, judul estimasi waktu tempuh, dan tombol tab kategori jika koordinat valid", () => {
      const html = renderToStaticMarkup(
        <CampusCommuteEstimator
          propertyName="Kos Graha Subang"
          propertyLat={-6.5682}
          propertyLng={107.7612}
        />
      );

      expect(html).toContain("Estimasi Waktu Tempuh ke Kampus &amp; Sekitar");
      expect(html).toContain("Kos Graha Subang");
      expect(html).toContain("Kampus &amp; Sekolah");
      expect(html).toContain("Semua Tempat");
    });
  });

  describe("Card Component: KosPropertyCard with Commute Badge", () => {
    it("menampilkan badge estimasi jalan kaki ramah ketika distance <= 1.5 km", () => {
      const html = renderToStaticMarkup(
        <KosPropertyCard
          name="Kos Melati UPI"
          price={850000}
          availableRooms={2}
          genderType="Putri"
          facilities="WiFi, Kasur, Lemari"
          ownerName="Ibu Hj. Siti"
          lastUpdated="2026-11-10T08:00:00Z"
          distance={0.8}
          distanceTargetName="UPI Subang"
        />
      );

      // Jarak 0.8 km * 13.3 = ~11 menit
      expect(html).toContain("🚶 11 mnt (0.8 km) dari UPI Subang");
    });

    it("menampilkan badge estimasi berkendara motor ketika distance > 1.5 km", () => {
      const html = renderToStaticMarkup(
        <KosPropertyCard
          name="Kos Sukamaju"
          price={750000}
          availableRooms={1}
          genderType="Campur"
          facilities="WiFi, Parkir Motor"
          ownerName="Pak Budi"
          lastUpdated="2026-11-10T08:00:00Z"
          distance={3.5}
          distanceTargetName="Polsub Cibogo"
        />
      );

      // Jarak 3.5 km * 2.14 + 1 = ~8 menit
      expect(html).toContain("🛵 8 mnt (3.5 km) dari Polsub Cibogo");
    });
  });
});

