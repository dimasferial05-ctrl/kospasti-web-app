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

    const normalizedPayouts = payouts.map((p) => {
      let gross = p.gross_amount || 0;
      let fee = p.platform_fee || 0;
      let net = p.net_amount || 0;

      // Fallback data legacy: jika gross_amount masih 0 namun amount ada
      if (gross <= 0 && p.amount > 0) {
        gross = p.amount;
        fee = Math.round(gross * 0.03);
        net = Math.max(0, gross - fee);
      } else if (net <= 0 && gross > 0) {
        fee = fee > 0 ? fee : Math.round(gross * 0.03);
        net = Math.max(0, gross - fee);
      }

      return {
        ...p,
        gross_amount: gross,
        platform_fee: fee,
        net_amount: net,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: normalizedPayouts,
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
