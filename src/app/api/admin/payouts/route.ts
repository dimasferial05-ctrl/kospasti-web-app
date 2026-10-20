import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processReadyPayouts } from "@/lib/payout-processor";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse("Unauthorized: Akses ditolak. Anda harus login sebagai admin.");
    }

    // Jalankan lazy evaluation untuk memproses booking COMPLETED yang sudah melewati grace period 12 jam
    try {
      await processReadyPayouts();
    } catch (procErr) {
      console.error("[PAYOUT PROCESSOR ERROR] Gagal menjalankan processReadyPayouts:", procErr);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const whereClause: { status?: string } = {};
    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            property: true,
            user: true,
            room_type: true,
          },
        },
        owner: {
          include: {
            payout_method: true,
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
    console.error("Gagal mengambil data payout admin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
