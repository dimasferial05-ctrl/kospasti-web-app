import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const { id } = await props.params;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "ID properti wajib disertakan." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: id.trim() },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Properti kos tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { is_featured, featured_until } = body;

    let parsedFeaturedUntil: Date | null = null;
    if (featured_until) {
      const d = new Date(featured_until);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, error: "Format tanggal featured_until tidak valid." },
          { status: 400 }
        );
      }
      parsedFeaturedUntil = d;
    }

    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: {
        is_featured: Boolean(is_featured),
        featured_until: Boolean(is_featured) ? parsedFeaturedUntil : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Status Featured kos "${updatedProperty.name}" berhasil diperbarui oleh Admin.`,
        data: {
          id: updatedProperty.id,
          name: updatedProperty.name,
          is_featured: updatedProperty.is_featured,
          featured_until: updatedProperty.featured_until,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memperbarui status featured kos oleh admin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memperbarui status promosi kos." },
      { status: 500 }
    );
  }
}
