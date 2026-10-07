import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteProps {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * PATCH /api/partner/reviews/[id]
 * Menyimpan atau memperbarui balasan ulasan oleh mitra pemilik kos.
 */
export async function PATCH(request: NextRequest, props: RouteProps) {
  try {
    const { id } = await Promise.resolve(props.params);
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID ulasan diperlukan" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

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

    const body = await request.json().catch(() => null);
    const reply = body?.reply?.trim();

    if (!reply) {
      return NextResponse.json(
        { success: false, error: "Teks balasan ulasan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cari ulasan dan cek kepemilikan kos
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            owner_id: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Ulasan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi kepemilikan ulasan
    if (review.property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki akses untuk membalas ulasan ini" },
        { status: 403 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        reply,
        replied_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            image_url: true,
            address: true,
          },
        },
        booking: {
          select: {
            id: true,
            student_name: true,
            room_type_id: true,
            room_type: {
              select: {
                id: true,
                name: true,
                price_per_month: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Balasan ulasan berhasil disimpan",
      review: updatedReview,
    });
  } catch (error: any) {
    console.error("Error updating review reply:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/reviews/[id]
 * Menghapus balasan ulasan oleh mitra pemilik kos.
 */
export async function DELETE(request: NextRequest, props: RouteProps) {
  try {
    const { id } = await Promise.resolve(props.params);
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID ulasan diperlukan" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

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

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            owner_id: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Ulasan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (review.property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki akses untuk menghapus balasan ulasan ini" },
        { status: 403 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        reply: null,
        replied_at: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Balasan ulasan berhasil dihapus",
      review: updatedReview,
    });
  } catch (error: any) {
    console.error("Error deleting review reply:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
