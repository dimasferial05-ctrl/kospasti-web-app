import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPayoutProcessed } from "@/lib/notifications";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";
import { createDisbursement } from "@/lib/disbursement";

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

    // 1. Eksekusi transfer otomatis ke rekening mitra via Payout Gateway (Midtrans Iris)
    const disbursementResult = await createDisbursement({
      payoutId: payout.id,
      amount: payout.net_amount || payout.amount,
      bankName: payoutMethod.bank_name,
      accountNumber: payoutMethod.account_number,
      accountHolder: payoutMethod.account_holder,
      notes: notes || `Pencairan Sewa ${payout.booking?.property?.name || "Kos"} (Booking #${payout.booking_id.slice(0, 8)})`,
      ownerEmail: payout.owner.email,
    });

    if (!disbursementResult.success) {
      // Simpan catatan kegagalan gateway ke record payout
      await prisma.payout.update({
        where: { id },
        data: {
          disbursement_error: disbursementResult.error || "Gagal mentransfer dana via disbursement gateway",
          disbursement_status: "failed",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: `Pencairan dana via Payout Gateway gagal: ${disbursementResult.error || "Terjadi kesalahan pada gateway transfer."}`,
        },
        { status: 502 }
      );
    }

    const snapshot = JSON.stringify({
      bank_name: payoutMethod.bank_name,
      account_number: payoutMethod.account_number,
      account_holder: payoutMethod.account_holder,
      verified_at: payoutMethod.verified_at,
      disbursement_ref: disbursementResult.referenceNo || null,
      disbursement_provider: disbursementResult.provider,
      is_simulated: disbursementResult.isSimulated,
    });

    const now = new Date();

    const [updatedPayout] = await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: {
          status: "PAYOUT_PAID",
          disbursement_id: disbursementResult.disbursementId || null,
          disbursement_reference_no: disbursementResult.referenceNo || null,
          disbursement_status: disbursementResult.status || "completed",
          disbursement_provider: disbursementResult.provider || "MIDTRANS_IRIS",
          disbursement_error: null,
          processed_at: now,
          processed_by: "Admin KosPasti",
          payout_method_snapshot: snapshot,
          notes: notes || payout.notes || (disbursementResult.isSimulated ? "Pencairan dana otomatis via Midtrans Iris (Simulator Mode)." : "Pencairan dana otomatis berhasil via Midtrans Iris."),
        },
      }),
      prisma.booking.update({
        where: { id: payout.booking_id },
        data: {
          status: "PAYOUT_PAID",
        },
      }),
    ]);

    // 2. Kirim notifikasi WA & In-App ke mitra lengkap dengan Nomor Referensi Transfer Bank
    const transferAmount = payout.net_amount || payout.amount;
    await notifyPayoutProcessed({
      ownerName: payout.owner.name,
      ownerWhatsapp: payout.owner.whatsapp_number,
      amount: transferAmount,
      bankName: payoutMethod.bank_name,
      accountNumber: payoutMethod.account_number,
      ownerId: payout.owner_id,
      referenceNo: disbursementResult.referenceNo || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Payout sebesar Rp ${transferAmount.toLocaleString("id-ID")} berhasil ditransfer otomatis ke rekening mitra (${disbursementResult.referenceNo}).`,
        data: {
          payout: updatedPayout,
          disbursement: {
            referenceNo: disbursementResult.referenceNo,
            status: disbursementResult.status,
            isSimulated: disbursementResult.isSimulated,
          },
        },
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
