import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/upload";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await props.params;
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

    if (!mediaId || typeof mediaId !== "string" || !mediaId.trim()) {
      return NextResponse.json(
        { success: false, error: "ID media tidak valid." },
        { status: 400 }
      );
    }

    // Cari media dan pastikan properti milik owner ini
    const media = await prisma.propertyMedia.findUnique({
      where: { id: mediaId.trim() },
      include: {
        property: true,
      },
    });

    if (!media || !media.property || media.property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Media tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
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
  } catch (error) {
    console.error("Gagal menghapus media mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
