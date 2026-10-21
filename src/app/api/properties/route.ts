import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { findPropertiesWithinRadius } from "@/lib/propertyGeospatial";

export async function GET(request?: Request) {
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
