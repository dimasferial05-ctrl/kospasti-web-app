import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id") || undefined;
    const roomTypeId = searchParams.get("room_type_id") || undefined;
    const ratingParam = searchParams.get("rating");
    const rating = ratingParam ? parseInt(ratingParam, 10) : undefined;

    // Ambil daftar properti & tipe kamar milik owner untuk opsi filter
    const properties = await prisma.property.findMany({
      where: { owner_id: payload.ownerId },
      select: {
        id: true,
        name: true,
        image_url: true,
        room_types: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
          },
          orderBy: {
            price_per_month: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Susun kondisi where untuk ulasan
    const whereClause: Record<string, any> = {
      property: {
        owner_id: payload.ownerId,
      },
    };

    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    if (roomTypeId) {
      whereClause.booking = {
        room_type_id: roomTypeId,
      };
    }

    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
      whereClause.rating = rating;
    }

    // Ambil data ulasan sesuai filter
    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            image_url: true,
            address: true,
          },
        },
        booking: {
          select: {
            id: true,
            student_name: true,
            room_type_id: true,
            room_type: {
              select: {
                id: true,
                name: true,
                price_per_month: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Hitung statistik ulasan keseluruhan owner
    const allReviews = await prisma.review.findMany({
      where: {
        property: {
          owner_id: payload.ownerId,
        },
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = allReviews.length;
    const totalScore = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;
    const positiveReviewsCount = allReviews.filter((r) => r.rating >= 4).length;
    const positivePercentage = totalReviews > 0 ? Math.round((positiveReviewsCount / totalReviews) * 100) : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      }
    }

    return NextResponse.json(
      {
        success: true,
        reviews,
        properties,
        stats: {
          totalReviews,
          averageRating,
          positivePercentage,
          distribution,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil ulasan mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar ulasan." },
      { status: 500 }
    );
  }
}
