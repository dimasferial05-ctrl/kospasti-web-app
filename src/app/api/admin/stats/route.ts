import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    // 1. Hitung total kos
    const totalProperties = await prisma.property.count();

    // 2. Hitung total booking & booking hari ini (reset harian)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const totalBookings = await prisma.booking.count();
    const todayBookings = await prisma.booking.count({
      where: {
        created_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 3. Jumlahkan semua sisa kamar (available_rooms)
    const roomsAggregation = await prisma.property.aggregate({
      _sum: {
        available_rooms: true,
      },
    });
    const totalAvailableRooms = roomsAggregation._sum.available_rooms || 0;

    // 4. Ambil riwayat booking terbaru (untuk pagination dasbor)
    const recentBookings = await prisma.booking.findMany({
      take: 50,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        student_name: true,
        move_in_date: true,
        status: true,
        created_at: true,
        property: {
          select: { name: true },
        },
      },
    });

    // 5. Ambil riwayat aktivitas magic link terbaru (untuk pagination dasbor)
    const recentMagicLinks = await prisma.magicLink.findMany({
      take: 50,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        is_used: true,
        created_at: true,
        expires_at: true,
        owner: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        properties: totalProperties,
        rooms: totalAvailableRooms,
        bookings: totalBookings,
        today_bookings: todayBookings,
        recent_bookings: recentBookings,
        recent_magic_links: recentMagicLinks,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data statistik admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}
