import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const payouts = await prisma.payout.findMany({
      where: { owner_id: payload.ownerId },
      include: {
        booking: {
          include: {
            property: true,
            user: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: payouts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil daftar payout mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
