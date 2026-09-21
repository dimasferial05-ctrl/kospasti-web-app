import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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
      booking.room_type?.price_per_month ?? booking.property?.price_per_month ?? 0;
    const adminFee = 5000;
    const totalPrice = rentPrice + adminFee;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: booking.id,
          studentName: booking.student_name,
          studentWhatsapp: booking.student_whatsapp,
          moveInDate: booking.move_in_date,
          status: booking.status,
          createdAt: booking.created_at,
          property: booking.property,
          roomType: booking.room_type,
          pricing: {
            rentPrice,
            adminFee,
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
