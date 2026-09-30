import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Ambil semua booking untuk kos milik owner
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          owner_id: payload.ownerId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            price_per_month: true,
            available_rooms: true,
          },
        },
        room_type: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memuat daftar pesanan mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data pesanan." },
      { status: 500 }
    );
  }
}
