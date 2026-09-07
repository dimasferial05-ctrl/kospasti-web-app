import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/upload";

export async function DELETE(
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
    const mediaId = resolvedParams.id;

    if (!mediaId || typeof mediaId !== "string" || mediaId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: ID media tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // Cari media yang ingin dihapus
    const media = await prisma.propertyMedia.findUnique({
      where: { id: mediaId.trim() },
      include: {
        property: true,
      },
    });

    if (!media) {
      return NextResponse.json(
        {
          success: false,
          error: "Media tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    // Hapus file fisik jika berupa upload lokal
    await deleteUploadedFile(media.url);

    // Hapus data dari database
    await prisma.propertyMedia.delete({
      where: { id: media.id },
    });

    // Jika media yang dihapus merupakan thumbnail utama properti (image_url),
    // update thumbnail properti ke media gambar lain yang masih ada (atau null)
    if (media.property && media.property.image_url === media.url) {
      const remainingMedia = await prisma.propertyMedia.findMany({
        where: { property_id: media.property_id },
        orderBy: { created_at: "asc" },
      });

      const nextImage = remainingMedia.find((m) => m.type === "IMAGE") || remainingMedia[0];
      const newImageUrl = nextImage ? nextImage.url : null;

      await prisma.property.update({
        where: { id: media.property_id },
        data: { image_url: newImageUrl },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Media berhasil dihapus.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal menghapus media:", error);
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
