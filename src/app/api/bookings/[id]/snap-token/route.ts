import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";
import {
  createSnapTransaction,
  SERVICE_FEE,
  getMidtransClientKey,
} from "@/lib/midtrans";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID booking diperlukan",
        },
        { status: 400 }
      );
    }

    const cleanId = id.trim();

    const booking = await prisma.booking.findUnique({
      where: { id: cleanId },
      include: {
        property: true,
        room_type: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (booking.user_id && booking.user_id !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Anda tidak memiliki izin untuk memproses pesanan ini.",
        },
        { status: 403 }
      );
    }

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Pembayaran sudah lunas untuk pesanan ini.",
        },
        { status: 400 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Status booking tidak valid untuk pembayaran (status saat ini: ${booking.status})`,
        },
        { status: 400 }
      );
    }

    const rentPrice =
      booking.room_type?.price_per_month ??
      booking.property?.price_per_month ??
      booking.amount ??
      0;

    const serviceFee = booking.service_fee || SERVICE_FEE;
    const securityDeposit = booking.security_deposit || 0;
    const grossAmount = rentPrice + serviceFee + securityDeposit;
    const propertyName = booking.property?.name || "Kamar Kos";
    const roomName = booking.room_type?.name ? ` - ${booking.room_type.name}` : "";

    // Buat order_id unik per sesi transaksi agar pengguna bisa mengganti metode pembayaran tanpa terkunci
    const midtransOrderId = `${booking.id}__${Date.now().toString(36)}`;

    const itemDetails = [
      {
        id: `RENT-${booking.id.slice(0, 10)}`,
        name: `Sewa ${propertyName}${roomName}`.substring(0, 50),
        price: rentPrice,
        quantity: 1,
      },
      {
        id: "SERVICE-FEE",
        name: "Biaya Layanan & Garansi Anti-Tipu",
        price: serviceFee,
        quantity: 1,
      },
    ];

    if (securityDeposit > 0) {
      itemDetails.push({
        id: "SECURITY-DEPOSIT",
        name: "Deposit Jaminan Kerusakan (Escrow)",
        price: securityDeposit,
        quantity: 1,
      });
    }

    // Minta Snap Token resmi ke Midtrans
    const snapResult = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount,
      customerDetails: {
        first_name: booking.student_name || "Mahasiswa",
        email: booking.user?.email || undefined,
        phone: booking.student_whatsapp || undefined,
      },
      itemDetails,
      expiryMinutes: 60 * 24, // 24 jam batas bayar
    });

    // Simpan snap_token dan nominal di database
    await prisma.booking.update({
      where: { id: cleanId },
      data: {
        snap_token: snapResult.token,
        amount: rentPrice,
        service_fee: serviceFee,
      },
    });

    return NextResponse.json(
      {
        success: true,
        token: snapResult.token,
        redirect_url: snapResult.redirect_url,
        clientKey: getMidtransClientKey(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal membuat Midtrans Snap token:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memproses pembayaran via gateway";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
