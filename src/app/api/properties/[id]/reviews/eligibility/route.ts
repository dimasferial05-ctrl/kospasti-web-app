import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

async function authenticateUser(request?: NextRequest) {
  const cookieStore = await cookies();
  const tokenFromStore = cookieStore.get("user_token")?.value;
  const tokenFromReq = request?.cookies?.get("user_token")?.value;
  const userToken = tokenFromStore || tokenFromReq;

  if (!userToken) {
    return null;
  }

  const payload = await verifyUserToken(userToken);
  return payload;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan" },
        { status: 400 }
      );
    }

    const payload = await authenticateUser(request);
    const userId = payload?.userId || (payload as { id?: string })?.id;

    if (!payload || !userId) {
      return NextResponse.json({
        success: true,
        data: {
          eligible: false,
          reason: "NOT_LOGGED_IN",
          message: "Silakan login terlebih dahulu untuk memberikan ulasan.",
        },
      });
    }

    // Cari booking user untuk properti ini yang statusnya SUCCESS atau PAID
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        property_id: propertyId,
        user_id: userId,
        status: {
          in: ["SUCCESS", "PAID"],
        },
      },
      include: {
        review: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (eligibleBookings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          eligible: false,
          reason: "NO_VERIFIED_BOOKING",
          message: "Hanya penyewa terverifikasi yang dapat memberikan ulasan.",
        },
      });
    }

    // Cari booking yang belum pernah diulas
    const unreviewedBooking = eligibleBookings.find((b) => !b.review);

    if (!unreviewedBooking) {
      return NextResponse.json({
        success: true,
        data: {
          eligible: false,
          reason: "ALREADY_REVIEWED",
          message: "Anda sudah memberikan ulasan untuk pesanan sewa kos ini.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        eligible: true,
        booking_id: unreviewedBooking.id,
        message: "Anda dapat memberikan ulasan untuk kos ini.",
      },
    });
  } catch (error) {
    console.error("Gagal memeriksa eligibilitas ulasan:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memeriksa status ulasan" },
      { status: 500 }
    );
  }
}
