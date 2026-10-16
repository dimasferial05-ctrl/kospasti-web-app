import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Lokasi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error("Gagal mengambil detail lokasi:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail lokasi" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, category, latitude, longitude, aliases, subdistrict, is_active } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Nama lokasi minimal 2 karakter" },
        { status: 400 }
      );
    }

    const updateData: Prisma.LocationUpdateInput = {
      name: name.trim(),
    };

    if (category && typeof category === "string") {
      updateData.category = category.trim();
    }

    if (latitude !== undefined) {
      const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json(
          { success: false, error: "Nilai latitude tidak valid" },
          { status: 400 }
        );
      }
      updateData.latitude = lat;
    }

    if (longitude !== undefined) {
      const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json(
          { success: false, error: "Nilai longitude tidak valid" },
          { status: 400 }
        );
      }
      updateData.longitude = lng;
    }

    if (aliases !== undefined) {
      updateData.aliases = typeof aliases === "string" && aliases.trim() ? aliases.trim() : null;
    }

    if (subdistrict !== undefined) {
      updateData.subdistrict = typeof subdistrict === "string" && subdistrict.trim() ? subdistrict.trim() : null;
    }

    if (typeof is_active === "boolean") {
      updateData.is_active = is_active;
    }

    const updated = await prisma.location.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal memperbarui data lokasi:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data lokasi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Lokasi berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal menghapus lokasi:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus lokasi" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    const updated = await prisma.location.update({
      where: { id },
      data: {
        is_active: typeof is_active === "boolean" ? is_active : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal mengubah status lokasi:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status lokasi" },
      { status: 500 }
    );
  }
}
