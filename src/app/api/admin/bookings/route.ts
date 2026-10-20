import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
            owner: {
              select: {
                name: true,
                whatsapp_number: true,
              },
            },
          },
        },
        room_type: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data booking admin:", error);
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
