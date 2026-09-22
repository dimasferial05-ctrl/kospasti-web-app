import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter token diperlukan",
        },
        { status: 400 }
      );
    }

    const trimmedToken = token.trim();

    const magicLink = await prisma.magicLink.findUnique({
      where: { token: trimmedToken },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
        booking: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                gender_type: true,
                image_url: true,
                price_per_month: true,
                available_rooms: true,
              },
            },
            room_type: {
              select: {
                id: true,
                name: true,
                price_per_month: true,
                available_rooms: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                whatsapp: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi tidak ditemukan atau tidak valid.",
        },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi ini sudah pernah digunakan sebelumnya.",
          isUsed: true,
          bookingStatus: magicLink.booking?.status || "UNKNOWN",
        },
        { status: 410 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi sudah kedaluwarsa (berlaku 24 jam).",
          isExpired: true,
        },
        { status: 410 }
      );
    }

    if (!magicLink.booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Data pesanan tidak terhubung dengan tautan ini.",
        },
        { status: 400 }
      );
    }

    const booking = magicLink.booking;

    return NextResponse.json(
      {
        success: true,
        message: "Token valid",
        data: {
          token: magicLink.token,
          ownerName: magicLink.owner.name,
          booking: {
            id: booking.id,
            studentName: booking.student_name,
            studentWhatsapp: booking.student_whatsapp,
            moveInDate: booking.move_in_date,
            status: booking.status,
            createdAt: booking.created_at,
            propertyName: booking.property.name,
            propertyAddress: booking.property.address,
            propertyImage: booking.property.image_url,
            genderType: booking.property.gender_type,
            roomTypeName: booking.room_type?.name || null,
            pricePerMonth: booking.room_type?.price_per_month || booking.property.price_per_month,
            userAvatar: booking.user?.avatar || null,
            userBio: booking.user?.bio || null,
            userEmail: booking.user?.email || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating booking magic link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
