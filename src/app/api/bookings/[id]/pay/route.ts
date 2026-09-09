import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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
          include: {
            owner: true,
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

    const updatedBooking = await prisma.booking.update({
      where: { id: id.trim() },
      data: {
        status: "PAID",
      },
    });

    // Simulasi Notifikasi WhatsApp ke Pemilik Kos (F-005)
    const owner = booking.property?.owner;
    const ownerPhone = owner?.whatsapp_number || "Tidak ada nomor WhatsApp";
    const ownerName = owner?.name || "Pemilik Kos";
    const studentName = booking.student_name;
    const propertyName = booking.property?.name || "Kos";

    console.log(`[SIMULASI WA] Mengirim pesan ke ${ownerPhone}:`);
    console.log(
      `"Halo Ibu/Bapak ${ownerName}, kamar kos Anda di ${propertyName} telah berhasil dipesan oleh ${studentName}. Uang DP (Booking Fee) telah diamankan oleh sistem KosPasti."`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Pembayaran berhasil dikonfirmasi",
        data: updatedBooking,
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
