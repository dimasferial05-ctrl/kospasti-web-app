import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken, verifyOwnerToken } from "@/lib/auth";
import { isValidAdminRequest } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 1. Ekstraksi dan verifikasi sesi pemanggil (User, Partner, atau Admin)
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

    const isAdmin = isValidAdminRequest(request);
    const userPayload = userToken ? await verifyUserToken(userToken) : null;
    const ownerPayload = partnerToken ? await verifyOwnerToken(partnerToken) : null;

    // Jika tidak ada satu pun sesi yang terotentikasi, tolak dengan 401 Unauthorized
    if (!isAdmin && !userPayload && !ownerPayload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu untuk mengakses rincian pesanan.",
        },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            price_per_month: true,
            image_url: true,
            gender_type: true,
            owner_id: true,
            owner: {
              select: {
                name: true,
                whatsapp_number: true,
              },
            },
          },
        },
        room_type: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
            image_url: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
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

    // 2. Evaluasi Hak Akses (Otorisasi Anti-IDOR)
    let isAuthorized = false;

    if (isAdmin) {
      isAuthorized = true;
    } else if (userPayload && booking.user_id === userPayload.userId) {
      isAuthorized = true;
    } else if (ownerPayload && booking.property?.owner_id === ownerPayload.ownerId) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Anda tidak memiliki izin untuk melihat rincian pesanan ini.",
        },
        { status: 403 }
      );
    }

    const rentPrice =
      booking.room_type?.price_per_month ?? booking.property?.price_per_month ?? booking.amount ?? 0;
    const adminFee = booking.service_fee || 5000;
    const totalPrice = rentPrice + adminFee;

    const invoiceDateStr = new Date(booking.created_at)
      .toISOString()
      .slice(0, 7)
      .replace("-", "");
    const invoiceNumber = `KP-INV-${invoiceDateStr}-${booking.id.slice(0, 6).toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: booking.id,
          invoiceNumber,
          studentName: booking.student_name,
          studentWhatsapp: booking.student_whatsapp,
          studentEmail: booking.user?.email || null,
          moveInDate: booking.move_in_date,
          status: booking.status,
          createdAt: booking.created_at,
          paidAt: booking.paid_at,
          paymentMethod: booking.payment_method,
          paymentGatewayRef: booking.payment_gateway_ref,
          snapToken: booking.snap_token,
          property: booking.property,
          roomType: booking.room_type,
          pricing: {
            rentPrice,
            adminFee,
            serviceFee: adminFee,
            totalPrice,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil data booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data booking",
      },
      { status: 500 }
    );
  }
}
