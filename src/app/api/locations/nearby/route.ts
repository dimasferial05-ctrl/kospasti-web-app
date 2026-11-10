import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistanceKm } from "@/lib/geocoding";
import { COMMON_LOCATION_COORDINATES } from "@/data/coordinates";
import { LOCATION_DATA } from "@/data/locationSuggestions";

export interface NearbyLocationItem {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  walkMinutes: number;
  driveMinutes: number;
  walkFormatted: string;
  driveFormatted: string;
  isWalkable: boolean;
  latitude: number;
  longitude: number;
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours} jam ${remMins} mnt` : `${hours} jam`;
  }
  return `${minutes} mnt`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const categoryParam = searchParams.get("category") || "all";
    const limitParam = searchParams.get("limit") || "5";
    const radiusParam = searchParams.get("radiusKm") || "25";

    if (!latParam || !lngParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter lat dan lng harus disediakan",
        },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter lat dan lng harus berupa angka koordinat yang valid",
        },
        { status: 400 }
      );
    }

    const limit = Math.max(1, Math.min(20, parseInt(limitParam) || 5));
    const maxRadiusKm = Math.max(1, parseFloat(radiusParam) || 25);

    type RawLoc = {
      id: string;
      name: string;
      category: string;
      latitude: number;
      longitude: number;
    };

    let rawLocations: RawLoc[] = [];

    // Coba ambil dari Database Prisma
    try {
      const dbLocations = await prisma.location.findMany({
        where: {
          is_active: true,
          ...(categoryParam !== "all"
            ? categoryParam === "kampus"
              ? { category: { in: ["kampus", "sekolah"] } }
              : { category: categoryParam }
            : {}),
        },
        select: {
          id: true,
          name: true,
          category: true,
          latitude: true,
          longitude: true,
        },
      });

      if (dbLocations && dbLocations.length > 0) {
        rawLocations = dbLocations;
      }
    } catch (dbErr) {
      console.warn("Kueri database lokasi gagal, menggunakan fallback kamus koordinat:", dbErr);
    }

    // Jika database kosong atau offline, gunakan fallback kamus koordinat internal
    if (rawLocations.length === 0) {
      const matchedKeys = new Set<string>();
      const fallbackList: RawLoc[] = [];

      for (const item of LOCATION_DATA) {
        if (matchedKeys.has(item.key)) continue;

        if (
          categoryParam !== "all" &&
          categoryParam === "kampus" &&
          item.category !== "kampus" &&
          item.category !== "sekolah"
        ) {
          continue;
        } else if (
          categoryParam !== "all" &&
          categoryParam !== "kampus" &&
          item.category !== categoryParam
        ) {
          continue;
        }

        const coords = COMMON_LOCATION_COORDINATES[item.key];
        if (coords) {
          matchedKeys.add(item.key);
          fallbackList.push({
            id: `fallback-${item.key}`,
            name: item.label,
            category: item.category,
            latitude: coords.lat,
            longitude: coords.lng,
          });
        }
      }

      rawLocations = fallbackList;
    }

    // Hitung jarak Haversine dan estimasi waktu tempuh
    const computedLocations: NearbyLocationItem[] = rawLocations
      .map((loc) => {
        const distanceKm = calculateHaversineDistanceKm(
          lat,
          lng,
          loc.latitude,
          loc.longitude
        );

        // Jalan kaki: ~4.5 km/jam (~13.3 menit/km)
        const walkMinutes = Math.max(1, Math.round(distanceKm * 13.33));
        // Berkendara motor: ~28 km/jam (~2.14 menit/km) + 1 menit toleransi lalu lintas
        const driveMinutes = Math.max(1, Math.round(distanceKm * 2.14 + 1));

        return {
          id: loc.id,
          name: loc.name,
          category: loc.category,
          distanceKm,
          walkMinutes,
          driveMinutes,
          walkFormatted: formatMinutes(walkMinutes),
          driveFormatted: formatMinutes(driveMinutes),
          isWalkable: distanceKm <= 1.5,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      })
      .filter((loc) => loc.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Ambil sejumlah limit yang diminta
    const finalData = computedLocations.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: finalData,
      total: computedLocations.length,
      propertyCoords: { lat, lng },
    });
  } catch (error) {
    console.error("Gagal menghitung lokasi terdekat:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat menghitung lokasi terdekat",
      },
      { status: 500 }
    );
  }
}
