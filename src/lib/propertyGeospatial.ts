import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function getTargetSchema(): string {
  try {
    const url = process.env.DATABASE_URL || "";
    const match = url.match(/[?&]schema=([^&]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // fallback
  }
  return "public";
}

export interface NearbyPropertyRaw {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distance: number;
}

export interface DetailedPropertyWithDistance {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_pet_friendly: boolean;
  is_24_hours: boolean;
  status?: string;
  rejectionReason?: string | null;
  average_rating: number;
  total_reviews: number;
  last_updated: Date | string;
  distance_km: number | null;
  owner?: {
    name: string;
  };
  room_types?: Array<{
    id: string;
    name: string;
    price_per_month: number;
    available_rooms: number;
    facilities?: string | null;
    image_url?: string | null;
  }>;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Menghitung kotak pembatas (Bounding Box) berdasarkan titik pusat koordinat dan radius (km).
 * 1 derajat latitude ~ 111.045 km
 * 1 derajat longitude ~ 111.045 * cos(latitude) km
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): BoundingBox {
  const safeRadius = Math.max(0.1, radiusKm);
  const latDelta = safeRadius / 111.045;

  // Lindungi dari pembagian 0 atau nilai ekstrem pada kutub
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 0.01);
  const lngDelta = safeRadius / (111.045 * cosLat);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Mengambil properti kos dalam radius tertentu (maksimal 10km secara default)
 * menggunakan Raw SQL PostgreSQL dengan Bounding Box Pre-filter dan Rumus Haversine.
 */
export async function findPropertiesWithinRadius(
  targetLat: number,
  targetLng: number,
  radiusInKm: number = 10,
  limit: number = 25
): Promise<NearbyPropertyRaw[]> {
  if (
    typeof targetLat !== "number" ||
    typeof targetLng !== "number" ||
    isNaN(targetLat) ||
    isNaN(targetLng) ||
    targetLat < -90 ||
    targetLat > 90 ||
    targetLng < -180 ||
    targetLng > 180
  ) {
    return [];
  }

  const safeRadius = Math.max(0.1, radiusInKm);
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const bbox = calculateBoundingBox(targetLat, targetLng, safeRadius);

  try {
    const tableIdentifier = Prisma.raw(`"${getTargetSchema()}"."Property"`);

    const rawProperties = await prisma.$queryRaw<NearbyPropertyRaw[]>`
      SELECT id, name, latitude, longitude,
        ( 6371 * acos( LEAST(1.0, GREATEST(-1.0,
          cos(radians(${targetLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${targetLng})) +
          sin(radians(${targetLat})) * sin(radians(latitude))
        )) ) ) AS distance
      FROM ${tableIdentifier}
      WHERE status = 'PUBLISHED'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN ${bbox.minLat} AND ${bbox.maxLat}
        AND longitude BETWEEN ${bbox.minLng} AND ${bbox.maxLng}
        AND ( 6371 * acos( LEAST(1.0, GREATEST(-1.0,
          cos(radians(${targetLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${targetLng})) +
          sin(radians(${targetLat})) * sin(radians(latitude))
        )) ) ) <= ${safeRadius}
      ORDER BY distance ASC
      LIMIT ${safeLimit};
    `;

    return rawProperties.map((p) => ({
      ...p,
      distance: Math.round(Number(p.distance) * 10) / 10,
    }));
  } catch (error) {
    console.error("Error running Haversine query raw SQL with bounding box:", error);
    return [];
  }
}

/**
 * Mengambil detail lengkap properti berdasarkan daftar ID yang dihasilkan
 * dari pencarian radius, dan menyematkan nilai distance_km.
 */
export async function fetchFullPropertiesByIds(
  nearbyItems: NearbyPropertyRaw[]
): Promise<DetailedPropertyWithDistance[]> {
  if (nearbyItems.length === 0) return [];

  const distanceMap = new Map<string, number>();
  for (const item of nearbyItems) {
    distanceMap.set(item.id, item.distance);
  }

  const ids = nearbyItems.map((n) => n.id);

  const rawProperties = await prisma.property.findMany({
    where: {
      id: { in: ids },
      status: "PUBLISHED",
    },
    include: {
      owner: {
        select: {
          name: true,
        },
      },
      media: true,
      room_types: {
        orderBy: {
          price_per_month: "asc",
        },
      },
    },
  });

  const detailedList: DetailedPropertyWithDistance[] = rawProperties.map((property) => {
    const roomTypes = property.room_types || [];
    const lowestPrice =
      roomTypes.length > 0
        ? Math.min(...roomTypes.map((rt) => rt.price_per_month))
        : property.price_per_month;
    const totalRooms =
      roomTypes.length > 0
        ? roomTypes.reduce((sum, rt) => sum + rt.available_rooms, 0)
        : property.available_rooms;

    return {
      id: property.id,
      name: property.name,
      price_per_month: lowestPrice,
      available_rooms: totalRooms,
      gender_type: property.gender_type,
      facilities: property.facilities,
      image_url:
        property.image_url ||
        property.media?.find((m) => m.type === "IMAGE")?.url ||
        property.media?.[0]?.url ||
        null,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      is_pet_friendly: property.is_pet_friendly,
      is_24_hours: property.is_24_hours,
      status: property.status,
      rejectionReason: property.rejectionReason,
      average_rating: property.average_rating ?? 0,
      total_reviews: property.total_reviews ?? 0,
      last_updated: property.updated_at,
      distance_km: distanceMap.get(property.id) ?? null,
      owner: property.owner,
      room_types: roomTypes,
    };
  });

  // Urutkan kembali sesuai urutan jarak ASC dari query haversine
  detailedList.sort((a, b) => {
    const distA = a.distance_km ?? 9999;
    const distB = b.distance_km ?? 9999;
    return distA - distB;
  });

  return detailedList;
}

/**
 * Fallback jika tidak ada koordinat: mengambil seluruh properti (atau limit tertentu)
 */
export async function getAllPropertiesFallback(
  limit: number = 30
): Promise<DetailedPropertyWithDistance[]> {
  try {
    const rawProperties = await prisma.property.findMany({
      take: limit,
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        updated_at: "desc",
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
      },
    });

    return rawProperties.map((property) => {
      const roomTypes = property.room_types || [];
      const lowestPrice =
        roomTypes.length > 0
          ? Math.min(...roomTypes.map((rt) => rt.price_per_month))
          : property.price_per_month;
      const totalRooms =
        roomTypes.length > 0
          ? roomTypes.reduce((sum, rt) => sum + rt.available_rooms, 0)
          : property.available_rooms;

      return {
        id: property.id,
        name: property.name,
        price_per_month: lowestPrice,
        available_rooms: totalRooms,
        gender_type: property.gender_type,
        facilities: property.facilities,
        image_url:
          property.image_url ||
          property.media?.find((m) => m.type === "IMAGE")?.url ||
          property.media?.[0]?.url ||
          null,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        is_pet_friendly: property.is_pet_friendly,
        is_24_hours: property.is_24_hours,
        status: property.status,
        rejectionReason: property.rejectionReason,
        average_rating: property.average_rating ?? 0,
        total_reviews: property.total_reviews ?? 0,
        last_updated: property.updated_at,
        distance_km: null,
        owner: property.owner,
        room_types: roomTypes,
      };
    });
  } catch (error) {
    console.error("Error fetching fallback properties:", error);
    return [];
  }
}
