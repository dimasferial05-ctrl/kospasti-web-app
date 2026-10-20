import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPayoutProcessed } from "@/lib/notifications";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse("Unauthorized: Akses ditolak. Anda harus login sebagai admin.");
    }

    const { id } = await props.params;
    const body = await request.json().catch(() => ({}));
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            payout_method: true,
          },
        },
        booking: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Record payout tidak ditemukan." },
        { status: 404 }
      );
    }

    if (payout.status !== "PAYOUT_PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Status payout tidak valid (${payout.status}). Hanya payout berstatus PAYOUT_PENDING yang dapat diproses.`,
        },
        { status: 400 }
      );
    }

    const payoutMethod = payout.owner.payout_method;
    if (!payoutMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Mitra belum mendaftarkan metode/rekening pencairan dana.",
        },
        { status: 400 }
      );
    }

    if (!payoutMethod.is_verified) {
      return NextResponse.json(
        {
          success: false,
          error: "Rekening mitra belum diverifikasi oleh admin. Harap verifikasi rekening terlebih dahulu sebelum memproses payout.",
        },
        { status: 400 }
      );
    }

    const snapshot = JSON.stringify({
      bank_name: payoutMethod.bank_name,
      account_number: payoutMethod.account_number,
      account_holder: payoutMethod.account_holder,
      verified_at: payoutMethod.verified_at,
    });

    const now = new Date();

    const [updatedPayout] = await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: {
          status: "PAYOUT_PAID",
          processed_at: now,
          processed_by: "Admin KosPasti",
          payout_method_snapshot: snapshot,
          notes: notes || payout.notes || "Pencairan dana berhasil diproses.",
        },
      }),
      prisma.booking.update({
        where: { id: payout.booking_id },
        data: {
          status: "PAYOUT_PAID",
        },
      }),
    ]);

    // Kirim notifikasi WA ke mitra
    await notifyPayoutProcessed({
      ownerName: payout.owner.name,
      ownerWhatsapp: payout.owner.whatsapp_number,
      amount: payout.amount,
      bankName: payoutMethod.bank_name,
      accountNumber: payoutMethod.account_number,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Payout sebesar Rp ${payout.amount.toLocaleString("id-ID")} berhasil diproses ke rekening mitra.`,
        data: updatedPayout,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memproses payout:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat memproses payout." },
      { status: 500 }
    );
  }
}
