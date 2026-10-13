import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyCheckinConfirmed } from "@/lib/notifications";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Pesanan booking tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan booking dimiliki oleh mitra yang sedang login
    if (booking.property.owner_id !== payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak memiliki akses ke pesanan ini." },
        { status: 403 }
      );
    }

    // Hanya booking berstatus APPROVED atau ACCEPTED yang bisa dikonfirmasi check-in
    if (booking.status !== "ACCEPTED" && booking.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: `Status booking tidak valid (${booking.status}). Hanya pesanan yang disetujui (APPROVED/ACCEPTED) yang dapat dikonfirmasi check-in.`,
        },
        { status: 400 }
      );
    }

    // Validasi apakah tanggal check-in sudah tiba
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const moveIn = new Date(booking.move_in_date);
    moveIn.setHours(0, 0, 0, 0);

    if (today < moveIn) {
      return NextResponse.json(
        {
          success: false,
          error: "Tanggal check-in belum tiba. Konfirmasi hanya dapat dilakukan pada atau setelah tanggal masuk kos.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        checkin_confirmed_at: now,
      },
    });

    // Kirim notifikasi WA ke penyewa
    await notifyCheckinConfirmed({
      tenantName: booking.student_name,
      tenantWhatsapp: booking.student_whatsapp,
      propertyName: booking.property.name,
      checkinTime: now,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Check-in berhasil dikonfirmasi. Grace period 12 jam dimulai.",
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengonfirmasi check-in:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memproses konfirmasi check-in." },
      { status: 500 }
    );
  }
}
