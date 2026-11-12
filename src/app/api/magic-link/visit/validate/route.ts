import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const token = searchParams.get("token");

    if (!token || !token.trim()) {
      return NextResponse.json(
        { success: false, error: "Parameter token diperlukan." },
        { status: 400 }
      );
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token: token.trim() },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
        visit: {
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
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink || magicLink.type !== "VISIT_VERIFICATION") {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan verifikasi survei tidak ditemukan atau tidak valid.",
        },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan konfirmasi survei ini sudah pernah digunakan.",
          isUsed: true,
          visitStatus: magicLink.visit?.status || "UNKNOWN",
        },
        { status: 410 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Tautan konfirmasi survei sudah kedaluwarsa (berlaku 48 jam).",
          isExpired: true,
        },
        { status: 410 }
      );
    }

    if (!magicLink.visit) {
      return NextResponse.json(
        {
          success: false,
          error: "Data jadwal survei tidak terhubung dengan tautan ini.",
        },
        { status: 400 }
      );
    }

    const visit = magicLink.visit;

    return NextResponse.json(
      {
        success: true,
        message: "Token valid",
        data: {
          token: magicLink.token,
          ownerName: magicLink.owner.name,
          visit: {
            id: visit.id,
            studentName: visit.student_name,
            studentWhatsapp: visit.student_whatsapp,
            visitDate: visit.visit_date,
            visitTimeSlot: visit.visit_time_slot,
            notes: visit.notes,
            status: visit.status,
            createdAt: visit.created_at,
            propertyId: visit.property.id,
            propertyName: visit.property.name,
            propertyAddress: visit.property.address,
            propertyImage: visit.property.image_url,
            genderType: visit.property.gender_type,
            availableRooms: visit.property.available_rooms,
            userAvatar: visit.user?.avatar || null,
            userBio: visit.user?.bio || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memvalidasi magic link survei:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

