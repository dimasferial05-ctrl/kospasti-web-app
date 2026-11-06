import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { findPropertiesWithinRadius } from "@/lib/propertyGeospatial";

function buildFacilityCondition(facility: string): Prisma.PropertyWhereInput {
  const normalized = facility.trim().toLowerCase();

  if (normalized === "kamar mandi dalam" || normalized === "kamar-mandi-dalam") {
    return {
      OR: [
        { facilities: { contains: "kamar mandi dalam", mode: "insensitive" } },
        { room_types: { some: { facilities: { contains: "kamar mandi dalam", mode: "insensitive" } } } },
        { room_types: { some: { specifications: { contains: "kamar mandi dalam", mode: "insensitive" } } } },
      ],
    };
  }

  if (normalized === "kamar mandi luar" || normalized === "kamar-mandi-luar") {
    return {
      OR: [
        { facilities: { contains: "kamar mandi luar", mode: "insensitive" } },
        { room_types: { some: { facilities: { contains: "kamar mandi luar", mode: "insensitive" } } } },
        { room_types: { some: { specifications: { contains: "kamar mandi luar", mode: "insensitive" } } } },
      ],
    };
  }

  if (normalized === "ac") {
    return {
      OR: [
        { facilities: { contains: "ac", mode: "insensitive" } },
        { room_types: { some: { facilities: { contains: "ac", mode: "insensitive" } } } },
        { room_types: { some: { specifications: { contains: "ac", mode: "insensitive" } } } },
      ],
    };
  }

  if (normalized === "kipas angin" || normalized === "kipas" || normalized === "kipas-angin") {
    return {
      OR: [
        { facilities: { contains: "kipas", mode: "insensitive" } },
        { room_types: { some: { facilities: { contains: "kipas", mode: "insensitive" } } } },
        { room_types: { some: { specifications: { contains: "kipas", mode: "insensitive" } } } },
      ],
    };
  }

  if (
    normalized === "wifi" ||
    normalized === "wifi cepat" ||
    normalized === "wi-fi" ||
    normalized === "internet"
  ) {
    return {
      OR: [
        { facilities: { contains: "wifi", mode: "insensitive" } },
        { facilities: { contains: "internet", mode: "insensitive" } },
        { room_types: { some: { facilities: { contains: "wifi", mode: "insensitive" } } } },
        { room_types: { some: { facilities: { contains: "internet", mode: "insensitive" } } } },
      ],
    };
  }

  if (
    normalized === "termasuk listrik" ||
    normalized === "listrik gratis" ||
    normalized === "termasuk-listrik"
  ) {
    return {
      OR: [
        { rental_terms: { contains: "listrik", mode: "insensitive" } },
        { facilities: { contains: "termasuk listrik", mode: "insensitive" } },
        { facilities: { contains: "listrik gratis", mode: "insensitive" } },
        { room_types: { some: { specifications: { contains: "termasuk listrik", mode: "insensitive" } } } },
        { room_types: { some: { specifications: { contains: "listrik gratis", mode: "insensitive" } } } },
      ],
    };
  }

  if (
    normalized === "token listrik" ||
    normalized === "token sendiri" ||
    normalized === "listrik token" ||
    normalized === "token-listrik"
  ) {
    return {
      OR: [
        { rental_terms: { contains: "token", mode: "insensitive" } },
        { facilities: { contains: "token", mode: "insensitive" } },
        { room_types: { some: { specifications: { contains: "token", mode: "insensitive" } } } },
      ],
    };
  }

  if (normalized === "parkir mobil" || normalized === "parkir-mobil") {
    return {
      OR: [
        { facilities: { contains: "parkir mobil", mode: "insensitive" } },
        { facilities: { contains: "mobil", mode: "insensitive" } },
      ],
    };
  }

  if (normalized === "parkir motor" || normalized === "parkir-motor") {
    return {
      OR: [
        { facilities: { contains: "parkir motor", mode: "insensitive" } },
        { facilities: { contains: "motor", mode: "insensitive" } },
        { facilities: { contains: "parkir", mode: "insensitive" } },
      ],
    };
  }

  if (
    normalized === "bebas jam malam" ||
    normalized === "akses 24 jam" ||
    normalized === "24 jam" ||
    normalized === "bebas-jam-malam"
  ) {
    return {
      OR: [
        { is_24_hours: true },
        { facilities: { contains: "24 jam", mode: "insensitive" } },
        { facilities: { contains: "bebas jam malam", mode: "insensitive" } },
      ],
    };
  }

  if (
    normalized === "pet friendly" ||
    normalized === "boleh bawa hewan" ||
    normalized === "hewan" ||
    normalized === "pet-friendly"
  ) {
    return {
      OR: [
        { is_pet_friendly: true },
        { facilities: { contains: "pet friendly", mode: "insensitive" } },
        { facilities: { contains: "hewan", mode: "insensitive" } },
      ],
    };
  }

  // Fallback umum: cocokkan ke facilities atau room_types.facilities
  return {
    OR: [
      { facilities: { contains: facility.trim(), mode: "insensitive" } },
      { room_types: { some: { facilities: { contains: facility.trim(), mode: "insensitive" } } } },
    ],
  };
}

export async function GET(request: Request) {
  try {
    const url = request ? new URL(request.url) : new URL("http://localhost/api/properties");
    const { searchParams } = url;
    const name = searchParams.get("name");
    const maxPrice = searchParams.get("maxPrice");
    const genderType = searchParams.get("genderType");
    const isPetFriendly = searchParams.get("isPetFriendly");
    const is24Hours = searchParams.get("is24Hours");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(limitParam || "24", 10) || 24, 100));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
    };

    let distanceMap: Map<string, number> | null = null;
    let nearbyIds: string[] = [];
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const radiusKm = radius && !isNaN(parseFloat(radius)) ? parseFloat(radius) : 10;
      const nearbyList = await findPropertiesWithinRadius(
        parseFloat(lat),
        parseFloat(lng),
        radiusKm,
        Math.max(100, skip + limit)
      );
      distanceMap = new Map();
      nearbyIds = [];
      for (const item of nearbyList) {
        nearbyIds.push(item.id);
        distanceMap.set(item.id, item.distance);
      }
      whereClause.id = { in: nearbyIds };
    }

    if (name && name.trim()) {
      whereClause.name = {
        contains: name.trim(),
        mode: "insensitive",
      };
    }

    if (maxPrice && maxPrice.trim()) {
      const parsedMaxPrice = parseInt(maxPrice.trim(), 10);
      if (!isNaN(parsedMaxPrice) && parsedMaxPrice >= 0) {
        whereClause.OR = [
          { price_per_month: { lte: parsedMaxPrice } },
          {
            room_types: {
              some: {
                price_per_month: { lte: parsedMaxPrice },
              },
            },
          },
        ];
      }
    }

    if (
      genderType &&
      genderType.trim() &&
      genderType.trim().toUpperCase() !== "ALL"
    ) {
      whereClause.gender_type = genderType.trim().toUpperCase();
    }

    if (isPetFriendly === "true") {
      whereClause.is_pet_friendly = true;
    }

    if (is24Hours === "true") {
      whereClause.is_24_hours = true;
    }

    // Filter Fasilitas Spesifik (Faceted Search)
    const facilitiesRaw = searchParams.getAll("facilities");
    const requestedFacilities = facilitiesRaw
      .flatMap((f) => f.split(","))
      .map((f) => f.trim())
      .filter(Boolean);

    if (requestedFacilities.length > 0) {
      const facilityConditions = requestedFacilities.map(buildFacilityCondition);
      if (!whereClause.AND) {
        whereClause.AND = facilityConditions;
      } else if (Array.isArray(whereClause.AND)) {
        whereClause.AND.push(...facilityConditions);
      } else {
        whereClause.AND = [whereClause.AND, ...facilityConditions];
      }
    }

    type RawPropertyItem = Prisma.PropertyGetPayload<{
      include: {
        owner: {
          select: {
            name: true;
          };
        };
        media: true;
        room_types: {
          orderBy: {
            price_per_month: "asc";
          };
        };
        reviews: {
          where: {
            is_hidden: false;
          };
          select: {
            rating: true;
          };
        };
      };
    }>;

    const propertyInclude = {
      owner: {
        select: {
          name: true,
        },
      },
      media: true,
      room_types: {
        orderBy: {
          price_per_month: "asc" as const,
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
    };

    let total = 0;
    let rawProperties: RawPropertyItem[] = [];

    if (distanceMap) {
      if (nearbyIds.length === 0) {
        total = 0;
        rawProperties = [];
      } else {
        const matchingRows = await prisma.property.findMany({
          where: whereClause,
          select: { id: true },
        });
        const matchingIdSet = new Set(matchingRows.map((r) => r.id));
        const filteredSortedIds = nearbyIds.filter((id) => matchingIdSet.has(id));
        total = filteredSortedIds.length;
        const pageIds = filteredSortedIds.slice(skip, skip + limit);

        if (pageIds.length > 0) {
          rawProperties = await prisma.property.findMany({
            where: { id: { in: pageIds } },
            include: propertyInclude,
          });
        } else {
          rawProperties = [];
        }
      }
    } else {
      const [countResult, propertiesResult] = await Promise.all([
        prisma.property.count({ where: whereClause }),
        prisma.property.findMany({
          where: whereClause,
          orderBy: {
            updated_at: "desc",
          },
          skip,
          take: limit,
          include: propertyInclude,
        }),
      ]);
      total = countResult;
      rawProperties = propertiesResult;
    }

    const properties = rawProperties.map((property) => {
      const roomTypes = property.room_types || [];
      const lowestPrice =
        roomTypes.length > 0
          ? Math.min(...roomTypes.map((rt) => rt.price_per_month))
          : property.price_per_month;
      const totalRooms =
        roomTypes.length > 0
          ? roomTypes.reduce((sum, rt) => sum + rt.available_rooms, 0)
          : property.available_rooms;

      const activeReviews = property.reviews || [];
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

      return {
        ...property,
        price_per_month: lowestPrice,
        available_rooms: totalRooms,
        average_rating: avgRating,
        total_reviews: totalReviews,
        image_url:
          property.image_url ||
          property.media?.find((m) => m.type === "IMAGE")?.url ||
          property.media?.[0]?.url ||
          null,
        last_updated: property.updated_at,
        room_types: roomTypes,
        distance_km: distanceMap ? (distanceMap.get(property.id) ?? null) : null,
      };
    });

    if (distanceMap) {
      properties.sort((a, b) => {
        const distA = a.distance_km ?? 9999;
        const distB = b.distance_km ?? 9999;
        return distA - distB;
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: properties,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil data properti:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data properti",
      },
      { status: 500 }
    );
  }
}
