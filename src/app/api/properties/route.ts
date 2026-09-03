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

    const whereClause: Prisma.PropertyWhereInput = {};

    if (name && name.trim()) {
      whereClause.name = {
        contains: name.trim(),
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
      },
    });

    const properties = rawProperties.map((property) => ({
      ...property,
      last_updated: property.updated_at,
    }));

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
