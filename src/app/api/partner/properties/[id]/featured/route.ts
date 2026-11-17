import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra pemilik kos." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "ID properti diperlukan." },
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

    if (property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Properti ini bukan milik Anda." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawDays = Number(body?.durationDays);
    const durationDays = [7, 14, 30, 60, 90].includes(rawDays) ? rawDays : 30;

    const now = new Date();
    const currentExpiry =
      property.featured_until && new Date(property.featured_until) > now
        ? new Date(property.featured_until)
        : now;

    const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: {
        is_featured: true,
        featured_until: newExpiry,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Status Kos Rekomendasi berhasil diaktifkan selama ${durationDays} hari.`,
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
    console.error("Gagal mengaktifkan featured listing mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memproses promosi kos." },
      { status: 500 }
    );
  }
}
