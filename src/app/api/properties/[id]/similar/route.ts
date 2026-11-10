import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHaversineDistanceKm } from "@/lib/geocoding";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID properti acuan diperlukan",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit") || "3";
    const limit = Math.max(1, Math.min(6, parseInt(limitParam) || 3));

    // 1. Ambil data kos acuan
    const targetProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        room_types: true,
      },
    });

    if (!targetProperty) {
      return NextResponse.json(
        {
          success: false,
          error: "Properti acuan tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Hitung harga per bulan acuan (ambil yang terendah jika multi tipe)
    const targetRoomTypes = targetProperty.room_types || [];
    const targetPrice =
      targetRoomTypes.length > 0
        ? Math.min(...targetRoomTypes.map((rt) => rt.price_per_month))
        : targetProperty.price_per_month;

    const minPrice = Math.round(targetPrice * 0.70); // -30%
    const maxPrice = Math.round(targetPrice * 1.35); // +35%

    // 2. Kueri kandidat properti yang aktif (PUBLISHED) selain properti saat ini
    const candidates = await prisma.property.findMany({
      where: {
        id: { not: id },
        status: "PUBLISHED",
      },
      orderBy: {
        updated_at: "desc",
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
      take: 25, // Ambil pool kandidat untuk diberi skor
    });

    const targetHasCoords =
      typeof targetProperty.latitude === "number" &&
      typeof targetProperty.longitude === "number" &&
      !isNaN(targetProperty.latitude) &&
      !isNaN(targetProperty.longitude) &&
      targetProperty.latitude !== 0 &&
      targetProperty.longitude !== 0;

    // 3. Skoring relevansi kos alternatif
    const scoredCandidates = candidates.map((cand) => {
      const roomTypes = cand.room_types || [];
      const lowestPrice =
        roomTypes.length > 0
          ? Math.min(...roomTypes.map((rt) => rt.price_per_month))
          : cand.price_per_month;
      const totalRooms =
        roomTypes.length > 0
          ? roomTypes.reduce((sum, rt) => sum + rt.available_rooms, 0)
          : cand.available_rooms;

      let score = 0;

      // Kriteria A: Kesesuaian Gender
      if (cand.gender_type.toLowerCase() === targetProperty.gender_type.toLowerCase()) {
        score += 50; // Gender sama persis
      } else if (
        cand.gender_type.toLowerCase() === "campur" ||
        targetProperty.gender_type.toLowerCase() === "campur"
      ) {
        score += 30; // Fleksibel campur
      }

      // Kriteria B: Ketersediaan Kamar (prioritaskan yang belum penuh)
      if (totalRooms > 0) {
        score += 40;
      }

      // Kriteria C: Jarak Radius (Haversine)
      let distanceKm: number | null = null;
      const candHasCoords =
        typeof cand.latitude === "number" &&
        typeof cand.longitude === "number" &&
        !isNaN(cand.latitude) &&
        !isNaN(cand.longitude) &&
        cand.latitude !== 0 &&
        cand.longitude !== 0;

      if (targetHasCoords && candHasCoords) {
        distanceKm = calculateHaversineDistanceKm(
          targetProperty.latitude!,
          targetProperty.longitude!,
          cand.latitude!,
          cand.longitude!
        );

        if (distanceKm <= 2.0) {
          score += 45; // Radius sangat dekat (<= 2 km)
        } else if (distanceKm <= 5.0) {
          score += 25; // Radius dekat (<= 5 km)
        } else if (distanceKm <= 10.0) {
          score += 10;
        }
      }

      // Kriteria D: Kedekatan Rentang Harga
      if (lowestPrice >= minPrice && lowestPrice <= maxPrice) {
        score += 30;
        const diffRatio = Math.abs(lowestPrice - targetPrice) / Math.max(1, targetPrice);
        score += Math.max(0, Math.round((1 - diffRatio) * 20));
      }

      const activeReviews = cand.reviews || [];
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
        property: {
          ...cand,
          price_per_month: lowestPrice,
          available_rooms: totalRooms,
          average_rating: avgRating,
          total_reviews: totalReviews,
          image_url:
            cand.image_url ||
            cand.media?.find((m) => m.type === "IMAGE")?.url ||
            cand.media?.[0]?.url ||
            null,
          last_updated: cand.updated_at,
          distance_km: distanceKm,
        },
        score,
        distanceKm,
        totalRooms,
      };
    });

    // Filter kandidat yang bukan properti acuan (defense-in-depth)
    const validCandidates = scoredCandidates.filter(
      (item) => item.property.id !== id && item.score > 0
    );

    // Urutkan berdasarkan: Score DESC -> Sisa Kamar DESC -> Jarak ASC
    validCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.totalRooms !== a.totalRooms) return b.totalRooms - a.totalRooms;
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

    const finalProperties = validCandidates
      .slice(0, limit)
      .map((item) => item.property);

    return NextResponse.json({
      success: true,
      data: finalProperties,
      total: finalProperties.length,
    });
  } catch (error) {
    console.error("Gagal mengambil kos serupa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat mengambil rekomendasi kos serupa",
      },
      { status: 500 }
    );
  }
}
