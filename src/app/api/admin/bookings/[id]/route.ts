import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["PENDING", "SUCCESS", "CONFIRMED", "REJECTED", "CANCELLED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID booking diperlukan.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.status || typeof body.status !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Payload status diperlukan.",
        },
        {
          status: 400,
        }
      );
    }

    const status = body.status.trim().toUpperCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status '${body.status}' tidak valid. Status yang diizinkan: ${ALLOWED_STATUSES.join(", ")}`,
        },
        {
          status: 400,
        }
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: id.trim() },
    });

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id.trim() },
      data: {
        status: status,
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Status booking berhasil diperbarui.",
        data: updatedBooking,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal memperbarui status booking admin:", error);
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
