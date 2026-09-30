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

    // Ambil properti milik owner
    const properties = await prisma.property.findMany({
      where: { owner_id: ownerId },
      include: {
        bookings: true,
      },
    });

    const totalProperties = properties.length;
    const totalAvailableRooms = properties.reduce(
      (sum, p) => sum + (p.available_rooms || 0),
      0
    );

    const propertyIds = properties.map((p) => p.id);

    const bookings = await prisma.booking.findMany({
      where: {
        property_id: { in: propertyIds },
      },
    });

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => b.status === "PENDING" || b.status === "PAID").length;
    const approvedBookings = bookings.filter((b) => b.status === "APPROVED" || b.status === "ACCEPTED").length;
    const rejectedBookings = bookings.filter((b) => b.status === "REJECTED").length;

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
