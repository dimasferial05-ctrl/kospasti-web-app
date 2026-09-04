import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== "Bearer 778899") {
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

    // 2. Hitung total booking
    const totalBookings = await prisma.booking.count();

    // 3. Jumlahkan semua sisa kamar (available_rooms)
    const roomsAggregation = await prisma.property.aggregate({
      _sum: {
        available_rooms: true,
      },
    });
    const totalAvailableRooms = roomsAggregation._sum.available_rooms || 0;

    return NextResponse.json({
      success: true,
      data: {
        properties: totalProperties,
        rooms: totalAvailableRooms,
        bookings: totalBookings,
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
