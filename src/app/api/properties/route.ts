import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request?: Request) {
  try {
    const url = request ? new URL(request.url) : new URL("http://localhost/api/properties");
    const { searchParams } = url;
    const name = searchParams.get("name");
    const maxPrice = searchParams.get("maxPrice");
    const genderType = searchParams.get("genderType");
    const isPetFriendly = searchParams.get("isPetFriendly");
    const is24Hours = searchParams.get("is24Hours");

    const whereClause: Prisma.PropertyWhereInput = {};

    if (name && name.trim()) {
      whereClause.name = {
        contains: name.trim(),
        mode: "insensitive",
      };
    }

    if (maxPrice && maxPrice.trim()) {
      const parsedMaxPrice = parseInt(maxPrice.trim(), 10);
      if (!isNaN(parsedMaxPrice) && parsedMaxPrice >= 0) {
        whereClause.price_per_month = {
          lte: parsedMaxPrice,
        };
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

    const rawProperties = await prisma.property.findMany({
      where: whereClause,
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

      return {
        ...property,
        price_per_month: lowestPrice,
        available_rooms: totalRooms,
        image_url:
          property.image_url ||
          property.media?.find((m) => m.type === "IMAGE")?.url ||
          property.media?.[0]?.url ||
          null,
        last_updated: property.updated_at,
        room_types: roomTypes,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: properties,
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
