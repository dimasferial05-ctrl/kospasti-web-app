import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
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

    const resolvedParams = await context.params;
    const propertyId = resolvedParams.id;

    if (!propertyId || typeof propertyId !== "string" || propertyId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: ID properti tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId.trim() },
    });

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          error: "Properti tidak ditemukan.",
        },
        {
          status: 404,
        }
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

    if (!targetMediaUrl || typeof targetMediaUrl !== "string" || targetMediaUrl.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: URL media atau ID media wajib disertakan.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId.trim() },
      data: {
        image_url: targetMediaUrl.trim(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
        media: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProperty,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal memperbarui thumbnail properti:", error);
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
