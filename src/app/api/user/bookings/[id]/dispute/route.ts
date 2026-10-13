import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan." },
        { status: 404 }
      );
    }

    if (booking.user_id !== payload.userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak memiliki izin untuk pesanan ini." },
        { status: 403 }
      );
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Hanya pesanan berstatus COMPLETED yang dapat diajukan sanggahan/dispute.",
        },
        { status: 400 }
      );
    }

    if (!booking.checkin_confirmed_at) {
      return NextResponse.json(
        { success: false, error: "Waktu konfirmasi check-in tidak valid." },
        { status: 400 }
      );
    }

    const graceDeadline = new Date(booking.checkin_confirmed_at.getTime() + 12 * 60 * 60 * 1000);
    if (Date.now() > graceDeadline.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Batas waktu grace period (12 jam) telah berakhir. Pengajuan dispute sudah ditutup.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "DISPUTED",
        cancellation_reason: reason || "Penyewa mengajukan masalah/dispute check-in dalam batas grace period 12 jam.",
      },
    });

    console.log(
      `[ADMIN DISPUTE ALERT] Dispute diajukan untuk booking ${booking.id} (${booking.property.name}) oleh penyewa ${payload.name} (${payload.email}). Alasan: ${reason}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Laporan masalah (dispute) berhasil diajukan. Tim Admin Escrow KosPasti akan segera menginvestigasi.",
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengajukan dispute:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat mengajukan dispute." },
      { status: 500 }
    );
  }
}
