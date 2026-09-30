import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        owner_id: payload.ownerId,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let targetMediaUrl = body.media_url || body.mediaUrl;

    if (body.media_id || body.mediaId) {
      const mediaRecord = await prisma.propertyMedia.findUnique({
        where: { id: String(body.media_id || body.mediaId).trim() },
      });
      if (mediaRecord) {
        targetMediaUrl = mediaRecord.url;
      }
    }

    if (!targetMediaUrl || typeof targetMediaUrl !== "string" || !targetMediaUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "URL media atau ID media wajib disertakan." },
        { status: 400 }
      );
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        image_url: targetMediaUrl.trim(),
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Gagal mengatur thumbnail mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
