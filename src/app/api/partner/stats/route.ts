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

    const ownerId = payload.ownerId;

    // Ambil properti milik owner (hanya kolom yang diperlukan)
    const properties = await prisma.property.findMany({
      where: { owner_id: ownerId },
      select: {
        id: true,
        available_rooms: true,
      },
    });

    const totalProperties = properties.length;
    const totalAvailableRooms = properties.reduce(
      (sum, p) => sum + (p.available_rooms || 0),
      0
    );

    const propertyIds = properties.map((p) => p.id);

    let totalBookings = 0;
    let pendingBookings = 0;
    let approvedBookings = 0;
    let rejectedBookings = 0;

    if (propertyIds.length > 0) {
      const statusGroups = await prisma.booking.groupBy({
        by: ["status"],
        where: {
          property_id: { in: propertyIds },
        },
        _count: {
          _all: true,
        },
      });

      for (const group of statusGroups) {
        const count = group._count._all;
        totalBookings += count;
        if (group.status === "PENDING" || group.status === "PAID") {
          pendingBookings += count;
        } else if (group.status === "APPROVED" || group.status === "ACCEPTED") {
          approvedBookings += count;
        } else if (group.status === "REJECTED") {
          rejectedBookings += count;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalProperties,
          totalAvailableRooms,
          totalBookings,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil statistik mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat statistik." },
      { status: 500 }
    );
  }
}
