import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse("Unauthorized: Akses ditolak. Anda harus login sebagai admin.");
    }

    const { searchParams } = new URL(request.url);
    const filterUnverified = searchParams.get("unverified");

    const whereClause: { is_verified?: boolean } = {};
    if (filterUnverified === "true") {
      whereClause.is_verified = false;
    }

    const payoutMethods = await prisma.payoutMethod.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: payoutMethods,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil daftar rekening mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
