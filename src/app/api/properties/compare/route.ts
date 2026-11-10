import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistanceKm } from "@/lib/geocoding";
import { COMMON_LOCATION_COORDINATES } from "@/data/coordinates";

export interface ComparePropertyData {
  id: string;
  name: string;
  gender_type: string;
  price_per_month: number;
  available_rooms: number;
  facilities: string;
  rules: string | null;
  rental_terms: string | null;
  is_24_hours: boolean;
  is_pet_friendly: boolean;
  image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
  total_reviews: number;
  owner: {
    name: string | null;
    whatsapp_number: string | null;
    avatar_url: string | null;
  } | null;
  room_types: Array<{
    id: string;
    name: string;
    price_per_month: number;
    available_rooms: number;
    facilities: string | null;
    image_url: string | null;
  }>;
  nearest_campus?: {
    name: string;
    distance_km: number;
    walk_minutes: number;
    drive_minutes: number;
  } | null;
  structured_features: {
    has_ac: boolean;
    has_wifi: boolean;
    has_private_bathroom: boolean;
    has_bed: boolean;
    has_wardrobe: boolean;
    has_study_desk: boolean;
    has_shared_kitchen: boolean;
    has_refrigerator: boolean;
    has_motorcycle_parking: boolean;
    has_car_parking: boolean;
    has_laundry: boolean;
    is_electricity_included: boolean;
    has_curfew: boolean;
  };
}

// Helper untuk mengekstrak fitur terstruktur dari string fasilitas & aturan
function parseStructuredFeatures(
  facilitiesStr: string = "",
  rulesStr: string = "",
  termsStr: string = "",
  is24Hours: boolean = false
) {
  const combined = `${facilitiesStr} ${rulesStr} ${termsStr}`.toLowerCase();

  const hasPrivateBathroom =
    combined.includes("kamar mandi dalam") ||
    combined.includes("km dalam") ||
    combined.includes("k.mandi dalam");

  // Gunakan regex word boundary agar tidak salah cocok dengan kata seperti "kaca", "membaca", dll.
  const hasAC =
    /\bac\b/i.test(combined) && !/\b(non[- ]?ac|tanpa[- ]?ac)\b/i.test(combined);

  const hasWifi =
    combined.includes("wifi") || combined.includes("wi-fi") || combined.includes("internet");

  const hasBed =
    combined.includes("kasur") || combined.includes("springbed") || /\bbed\b/i.test(combined);

  const hasWardrobe = combined.includes("lemari");

  const hasStudyDesk =
    combined.includes("meja") || combined.includes("meja belajar") || combined.includes("kursi");

  const hasSharedKitchen = combined.includes("dapur") || combined.includes("dapur bersama");

  const hasRefrigerator = combined.includes("kulkas");

  const hasMotorcycleParking =
    combined.includes("parkir motor") || combined.includes("motor") || combined.includes("parkir");

  const hasCarParking = combined.includes("parkir mobil") || combined.includes("mobil");

  // Hanya cocokkan fasilitas laundry / mesin cuci pakaian (hindari salah cocok dari "cuci piring" atau "cuci tangan")
  const hasLaundry =
    combined.includes("mesin cuci") ||
    combined.includes("laundry") ||
    combined.includes("cuci baju") ||
    combined.includes("cuci pakaian");

  // Periksa frase negasi terlebih dahulu agar "belum termasuk listrik" tidak salah terdeteksi sebagai termasuk listrik
  const isElectricityExcluded =
    combined.includes("belum termasuk listrik") ||
    combined.includes("tidak termasuk listrik") ||
    combined.includes("di luar listrik") ||
    combined.includes("token") ||
    combined.includes("bayar sendiri") ||
    combined.includes("listrik mandiri") ||
    combined.includes("non-listrik");

  const isElectricityIncluded =
    !isElectricityExcluded &&
    (combined.includes("termasuk listrik") ||
      combined.includes("listrik gratis") ||
      combined.includes("free listrik") ||
      combined.includes("sudah listrik") ||
      (combined.includes("listrik") && !combined.includes("di luar")));

  const hasCurfew =
    !is24Hours &&
    (combined.includes("jam malam") ||
      combined.includes("maksimal jam") ||
      combined.includes("gerbang ditutup"));

  return {
    has_ac: hasAC,
    has_wifi: hasWifi,
    has_private_bathroom: hasPrivateBathroom,
    has_bed: hasBed,
    has_wardrobe: hasWardrobe,
    has_study_desk: hasStudyDesk,
    has_shared_kitchen: hasSharedKitchen,
    has_refrigerator: hasRefrigerator,
    has_motorcycle_parking: hasMotorcycleParking,
    has_car_parking: hasCarParking,
    has_laundry: hasLaundry,
    is_electricity_included: isElectricityIncluded,
    has_curfew: hasCurfew,
  };
}

// Daftar kampus terkenal & sekolah tinggi dari kamus koordinat untuk dicari yang terdekat
const CAMPUS_KEYS = Object.keys(COMMON_LOCATION_COORDINATES).filter((key) => {
  const lower = key.toLowerCase();
  return (
    lower.includes("universitas") ||
    lower.includes("kampus") ||
    lower.includes("upi") ||
    lower.includes("itb") ||
    lower.includes("unpad") ||
    lower.includes("ui") ||
    lower.includes("ipb") ||
    lower.includes("polsub") ||
    lower.includes("telkom") ||
    lower.includes("uin") ||
    lower.includes("unpar") ||
    lower.includes("politeknik") ||
    lower.includes("stie") ||
    lower.includes("stmi") ||
    lower.includes("stik") ||
    lower.includes("akper") ||
    lower.includes("stei") ||
    lower.includes("institut")
  );
});

function findNearestCampus(lat?: number | null, lng?: number | null) {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  let closest: { name: string; distance_km: number; walk_minutes: number; drive_minutes: number } | null = null;
  let minDistance = Infinity;

  for (const key of CAMPUS_KEYS) {
    const coords = COMMON_LOCATION_COORDINATES[key];
    if (!coords) continue;

    const dist = calculateHaversineDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      const walkMins = Math.max(1, Math.round(dist * 13.33));
      const driveMins = Math.max(1, Math.round(dist * 2.14 + 1));
      closest = {
        name: key.toUpperCase(),
        distance_km: dist,
        walk_minutes: walkMins,
        drive_minutes: driveMins,
      };
    }
  }

  // Jika jarak terdekat lebih dari 30km, jangan tampilkan kampus tak relevan
  if (closest && closest.distance_km > 30) {
    return null;
  }

  return closest;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam || !idsParam.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter ids diperlukan untuk membandingkan kos",
        },
        { status: 400 }
      );
    }

    const rawIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    // Filter unik dan batasi maksimal 3 kos
    const idList = Array.from(new Set(rawIds)).slice(0, 3);

    if (idList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Daftar ID kos yang valid tidak ditemukan",
        },
        { status: 400 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        id: { in: idList },
        status: "PUBLISHED",
      },
      include: {
        owner: {
          select: {
            name: true,
            whatsapp_number: true,
            avatar_url: true,
          },
        },
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
        reviews: {
          where: {
            is_hidden: false,
          },
          select: {
            rating: true,
          },
        },
      },
    });

    // Peta agar urutan hasil sesuai dengan idList yang diminta oleh klien
    const propertyMap = new Map<string, (typeof properties)[0]>();
    for (const p of properties) {
      propertyMap.set(p.id, p);
    }

    const orderedProperties: ComparePropertyData[] = [];

    for (const id of idList) {
      const p = propertyMap.get(id);
      if (!p) continue;

      const roomTypes = p.room_types || [];
      const lowestPrice =
        roomTypes.length > 0
          ? Math.min(...roomTypes.map((rt) => rt.price_per_month))
          : p.price_per_month;
      const totalRooms =
        roomTypes.length > 0
          ? roomTypes.reduce((sum, rt) => sum + rt.available_rooms, 0)
          : p.available_rooms;

      const activeReviews = p.reviews || [];
      const totalReviews = activeReviews.length;
      const avgRating =
        totalReviews > 0
          ? Number(
              (
                activeReviews.reduce((sum, r) => sum + r.rating, 0) /
                totalReviews
              ).toFixed(1)
            )
          : 0;

      const nearestCampus = findNearestCampus(p.latitude, p.longitude);

      const structuredFeatures = parseStructuredFeatures(
        p.facilities,
        p.rules || "",
        p.rental_terms || "",
        p.is_24_hours
      );

      orderedProperties.push({
        id: p.id,
        name: p.name,
        gender_type: p.gender_type,
        price_per_month: lowestPrice,
        available_rooms: totalRooms,
        facilities: p.facilities,
        rules: p.rules,
        rental_terms: p.rental_terms,
        is_24_hours: p.is_24_hours,
        is_pet_friendly: p.is_pet_friendly,
        image_url:
          p.image_url ||
          p.media?.find((m) => m.type === "IMAGE")?.url ||
          p.media?.[0]?.url ||
          null,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        average_rating: avgRating,
        total_reviews: totalReviews,
        owner: p.owner,
        room_types: roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          price_per_month: rt.price_per_month,
          available_rooms: rt.available_rooms,
          facilities: rt.facilities,
          image_url: rt.image_url,
        })),
        nearest_campus: nearestCampus,
        structured_features: structuredFeatures,
      });
    }

    return NextResponse.json({
      success: true,
      data: orderedProperties,
      total: orderedProperties.length,
    });
  } catch (error) {
    console.error("Gagal mengambil data komparasi kos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memuat data komparasi kos",
      },
      { status: 500 }
    );
  }
}

