import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const reviews = await prisma.review.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            move_in_date: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Gagal mengambil data review admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data ulasan",
      },
      {
        status: 500,
      }
    );
  }
}
