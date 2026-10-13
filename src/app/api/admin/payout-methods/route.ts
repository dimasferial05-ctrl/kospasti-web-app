import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Anda harus login sebagai admin." },
        { status: 401 }
      );
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
