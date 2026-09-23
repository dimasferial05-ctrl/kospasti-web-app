import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

async function authenticateUser(request?: NextRequest) {
  const cookieStore = await cookies();
  const tokenFromStore = cookieStore.get("user_token")?.value;
  const tokenFromReq = request?.cookies?.get("user_token")?.value;
  const userToken = tokenFromStore || tokenFromReq;

  if (!userToken) {
    return null;
  }

  const payload = await verifyUserToken(userToken);
  return payload;
}

/**
 * GET /api/properties/[id]/reviews
 * Mengambil daftar ulasan publik dan statistik rating untuk kos tertentu.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        property_id: propertyId,
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
    });

    const totalReviews = reviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let ratingSum = 0;
    for (const r of reviews) {
      ratingSum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating,
          distribution,
        },
      },
    });
  } catch (error) {
    console.error("Gagal mengambil ulasan properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ulasan" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties/[id]/reviews
 * Mengirim ulasan baru dari penyewa terverifikasi (Verified Tenant).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan" },
        { status: 400 }
      );
    }

    const payload = await authenticateUser(request);
    const userId = payload?.userId || (payload as { id?: string })?.id;

    if (!payload || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Silakan login terlebih dahulu untuk memberi ulasan.",
        },
        { status: 401 }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Format data request tidak valid" },
        { status: 400 }
      );
    }

    const { rating, comment, booking_id } = body || {};

    // Validasi rating
    const parsedRating = Number(rating);
    if (!parsedRating || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating harus berupa angka antara 1 sampai 5" },
        { status: 400 }
      );
    }

    // Cari booking yang valid
    let targetBooking;

    if (booking_id) {
      targetBooking = await prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id: userId,
          property_id: propertyId,
          status: {
            in: ["SUCCESS", "PAID"],
          },
        },
        include: {
          review: true,
        },
      });

      if (!targetBooking) {
        return NextResponse.json(
          {
            success: false,
            error: "Booking tidak ditemukan atau status belum terverifikasi (SUCCESS/PAID).",
          },
          { status: 403 }
        );
      }

      if (targetBooking.review) {
        return NextResponse.json(
          {
            success: false,
            error: "Ulasan sudah pernah diberikan untuk transaksi ini.",
          },
          { status: 409 }
        );
      }
    } else {
      // Cari booking terakhir yang belum diulas
      const eligibleBookings = await prisma.booking.findMany({
        where: {
          user_id: userId,
          property_id: propertyId,
          status: {
            in: ["SUCCESS", "PAID"],
          },
        },
        include: {
          review: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (eligibleBookings.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Hanya penyewa terverifikasi yang dapat memberikan ulasan.",
          },
          { status: 403 }
        );
      }

      targetBooking = eligibleBookings.find((b) => !b.review);

      if (!targetBooking) {
        return NextResponse.json(
          {
            success: false,
            error: "Anda sudah memberikan ulasan untuk seluruh pesanan kos ini.",
          },
          { status: 409 }
        );
      }
    }

    // Buat ulasan baru
    const newReview = await prisma.review.create({
      data: {
        rating: Math.round(parsedRating),
        comment: typeof comment === "string" ? comment.trim() : null,
        property_id: propertyId,
        user_id: userId,
        booking_id: targetBooking.id,
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
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ulasan dan rating berhasil dikirim!",
        data: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal mengirim ulasan:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat menyimpan ulasan" },
      { status: 500 }
    );
  }
}
