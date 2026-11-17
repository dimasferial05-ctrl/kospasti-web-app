import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";
import { fulfillPaidBooking } from "@/lib/payment-fulfillment";

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

    const booking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: {
        property: {
          include: {
            owner: true,
          },
        },
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
          error: "Akses ditolak: Anda tidak memiliki izin untuk memproses pembayaran pesanan ini.",
        },
        { status: 403 }
      );
    }

    if (booking.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Pembayaran sudah dilakukan sebelumnya",
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

    const fulfillmentResult = await fulfillPaidBooking({
      bookingId: booking.id,
      paymentMethod: "SIMULATION_INTERNAL",
      paymentGatewayRef: `SIM-${Date.now()}`,
      paidAt: new Date(),
      existingBooking: booking,
    });

    if (!fulfillmentResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: fulfillmentResult.message || "Gagal mengonfirmasi pembayaran",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pembayaran berhasil dikonfirmasi dan notifikasi WhatsApp telah dikirim.",
        data: fulfillmentResult.data,
        verificationUrl: fulfillmentResult.verificationUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengonfirmasi pembayaran booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengonfirmasi pembayaran",
      },
      { status: 500 }
    );
  }
}
