import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        avatar: true,
        bio: true,
        created_at: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data pengguna admin:", error);
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
