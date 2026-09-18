import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        user_id: payload.userId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
            available_rooms: true,
            gender_type: true,
            facilities: true,
            image_url: true,
            address: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil riwayat booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mengambil data pesanan.",
      },
      { status: 500 }
    );
  }
}
