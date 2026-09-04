import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload request tidak valid",
        },
        { status: 400 }
      );
    }

    const { propertyId, studentName, waNumber, moveInDate } = body;

    if (
      !propertyId ||
      typeof propertyId !== "string" ||
      !propertyId.trim() ||
      !studentName ||
      typeof studentName !== "string" ||
      !studentName.trim() ||
      !waNumber ||
      typeof waNumber !== "string" ||
      !waNumber.trim() ||
      !moveInDate ||
      typeof moveInDate !== "string" ||
      !moveInDate.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Data booking tidak lengkap. propertyId, studentName, waNumber, dan moveInDate wajib diisi.",
        },
        { status: 400 }
      );
    }

    const parsedDate = new Date(moveInDate.trim());
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal moveInDate tidak valid",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Kurangi kamar langsung DENGAN SYARAT kamar masih > 0
      const updatedProperty = await tx.property.updateMany({
        where: {
          id: propertyId.trim(),
          available_rooms: { gt: 0 },
        },
        data: {
          available_rooms: { decrement: 1 },
        },
      });

      // 2. Jika count 0, berarti ID salah atau kamar sudah 0 detik itu juga
      if (updatedProperty.count === 0) {
        throw new Error("Kamar sudah penuh atau tidak ditemukan");
      }

      // 3. Buat Data Booking jika update kamar di atas berhasil
      const newBooking = await tx.booking.create({
        data: {
          property_id: propertyId.trim(),
          student_name: studentName.trim(),
          student_whatsapp: waNumber.trim(),
          move_in_date: parsedDate,
          status: "PENDING",
        },
      });

      return newBooking;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking berhasil dibuat",
        data: {
          bookingId: result.id,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage === "Kamar sudah penuh atau tidak ditemukan" ||
      errorMessage === "Kamar sudah penuh" ||
      errorMessage === "Properti tidak ditemukan" ||
      errorMessage.includes("Kamar sudah penuh")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    console.error("Gagal membuat booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
