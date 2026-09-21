import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 0. Autentikasi Pengguna: Sesi user_token wajib valid
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu untuk melakukan pemesanan kos.",
        },
        { status: 401 }
      );
    }

    const userPayload = await verifyUserToken(userToken);
    if (!userPayload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa. Silakan login kembali.",
        },
        { status: 401 }
      );
    }

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

    const { propertyId, studentName, waNumber, moveInDate, roomTypeId } = body;

    // Ambil data profil user dari DB jika data diri tidak disertakan di request body
    const dbUser = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { name: true, whatsapp: true },
    }).catch(() => null);

    const resolvedStudentName = (typeof studentName === "string" && studentName.trim())
      ? studentName.trim()
      : (dbUser?.name || userPayload.name || "").trim();

    const resolvedWaNumber = (typeof waNumber === "string" && waNumber.trim())
      ? waNumber.trim()
      : (dbUser?.whatsapp || userPayload.whatsapp || "").trim();

    if (
      !propertyId ||
      typeof propertyId !== "string" ||
      !propertyId.trim() ||
      !resolvedStudentName ||
      !resolvedWaNumber ||
      !moveInDate ||
      typeof moveInDate !== "string" ||
      !moveInDate.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Data booking tidak lengkap. propertyId dan moveInDate wajib diisi serta profil akun harus memiliki Nama dan nomor WhatsApp.",
        },
        { status: 400 }
      );
    }

    if (resolvedWaNumber.length > 15) {
      return NextResponse.json(
        {
          success: false,
          error: "Panjang nomor WhatsApp melebihi batas maksimal (15 karakter)",
        },
        { status: 400 }
      );
    }

    const waRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;
    if (!waRegex.test(resolvedWaNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format nomor WhatsApp tidak valid",
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
      let resolvedRoomTypeId: string | null = null;
      if (roomTypeId && typeof roomTypeId === "string" && roomTypeId.trim()) {
        const updatedRoomType = await tx.roomType.updateMany({
          where: {
            id: roomTypeId.trim(),
            property_id: propertyId.trim(),
            available_rooms: { gt: 0 },
          },
          data: {
            available_rooms: { decrement: 1 },
          },
        });

        if (updatedRoomType.count === 0) {
          throw new Error("Tipe kamar sudah penuh atau tidak ditemukan");
        }
        resolvedRoomTypeId = roomTypeId.trim();
      }

      // 1. Kurangi kamar properti langsung DENGAN SYARAT kamar masih > 0
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
          room_type_id: resolvedRoomTypeId,
          student_name: resolvedStudentName,
          student_whatsapp: resolvedWaNumber,
          move_in_date: parsedDate,
          status: "PENDING",
          user_id: userPayload.userId,
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
      errorMessage === "Tipe kamar sudah penuh atau tidak ditemukan" ||
      errorMessage === "Kamar sudah penuh" ||
      errorMessage === "Properti tidak ditemukan" ||
      errorMessage.includes("sudah penuh")
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
