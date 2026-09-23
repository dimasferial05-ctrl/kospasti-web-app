import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await params;
    const reviewId = resolvedParams?.id;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "ID ulasan diperlukan" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: "Ulasan tidak ditemukan" },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Jika is_hidden disediakan, gunakan nilainya; jika tidak, lakukan toggle
    const isHidden = typeof body?.is_hidden === "boolean" ? body.is_hidden : !existingReview.is_hidden;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        is_hidden: isHidden,
      },
    });

    return NextResponse.json({
      success: true,
      message: isHidden
        ? "Ulasan berhasil disembunyikan dari publik"
        : "Ulasan berhasil ditampilkan kembali ke publik",
      data: updatedReview,
    });
  } catch (error) {
    console.error("Gagal mengubah status moderasi ulasan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui status ulasan",
      },
      {
        status: 500,
      }
    );
  }
}
