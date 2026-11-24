import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    const ownerId = payload?.ownerId || (payload as any)?.id;
    if (!payload || !ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ambil semua booking untuk kos milik owner
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          owner_id: ownerId,
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
        room_unit: {
          select: {
            id: true,
            unit_number: true,
            floor: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            is_identity_verified: true,
          },
        },
        payout: {
          select: {
            id: true,
            amount: true,
            status: true,
            payout_method_snapshot: true,
            processed_at: true,
            notes: true,
          },
        },
        checkin_inspection: {
          select: {
            id: true,
            is_locked: true,
            ac_condition: true,
            bed_condition: true,
            walls_condition: true,
            bathroom_condition: true,
            ac_photo_url: true,
            bed_photo_url: true,
            walls_photo_url: true,
            bathroom_photo_url: true,
            inspected_at: true,
            tenant_confirmed_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        bookings,
        data: bookings,
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
