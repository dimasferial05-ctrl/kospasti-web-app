import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
