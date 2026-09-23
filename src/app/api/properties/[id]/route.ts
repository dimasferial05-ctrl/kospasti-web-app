import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID properti diperlukan",
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            whatsapp_number: true,
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Properti tidak ditemukan",
        },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...property,
          average_rating: avgRating,
          total_reviews: totalReviews,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil detail properti:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil detail properti",
      },
      { status: 500 }
    );
  }
}
