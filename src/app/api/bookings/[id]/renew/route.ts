import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";
import { createInAppNotification } from "@/lib/notifications";

const ELIGIBLE_RENEWAL_STATUSES = [
  "PAID",
  "APPROVED",
  "ACCEPTED",
  "COMPLETED",
  "PAYOUT_PENDING",
  "PAYOUT_PAID",
];

export async function POST(
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
          error: "ID booking diperlukan.",
        },
        { status: 400 }
      );
    }

    // 1. Autentikasi Pengguna: Sesi user_token wajib valid
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu untuk memperpanjang sewa.",
        },
        { status: 401 }
      );
    }

    const userPayload = await verifyUserToken(userToken);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa. Silakan login kembali.",
        },
        { status: 401 }
      );
    }

    // 2. Ambil data booking yang hendak diperpanjang
    const existingBooking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
            owner_id: true,
          },
        },
        room_type: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: "Pesanan kos tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // 3. Otorisasi Anti-IDOR: Pengguna hanya boleh memperpanjang booking miliknya
    if (existingBooking.user_id !== userPayload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Anda tidak memiliki izin untuk memperpanjang pesanan ini.",
        },
        { status: 403 }
      );
    }

    // 4. Validasi Kelayakan Status Booking
    const currentStatus = (existingBooking.status || "").toUpperCase();
    if (!ELIGIBLE_RENEWAL_STATUSES.includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Pesanan dengan status '${existingBooking.status}' tidak dapat diperpanjang. Hanya pesanan aktif atau lunas yang dapat diperpanjang masa sewanya.`,
        },
        { status: 400 }
      );
    }

    // 5. Cek apakah ada booking perpanjangan yang masih PENDING untuk properti dan tipe kamar ini
    const activePendingRenewal = await prisma.booking.findFirst({
      where: {
        user_id: userPayload.userId,
        property_id: existingBooking.property_id,
        room_type_id: existingBooking.room_type_id,
        status: "PENDING",
      },
    });

    if (activePendingRenewal) {
      return NextResponse.json(
        {
          success: false,
          error: "Anda sudah memiliki pesanan perpanjangan yang masih berstatus PENDING. Silakan selesaikan pembayaran terlebih dahulu.",
          hasPendingRenewal: true,
          existingPendingBookingId: activePendingRenewal.id,
          checkoutUrl: `/checkout/${activePendingRenewal.id}`,
        },
        { status: 400 }
      );
    }

    // 6. Kalkulasi Tanggal Masuk Periode Baru (Occupancy Continuity)
    // Menambahkan 1 bulan kalender penuh dari tanggal masuk periode sebelumnya
    const prevMoveIn = new Date(existingBooking.move_in_date);
    const nextMoveInDate = new Date(prevMoveIn);
    nextMoveInDate.setMonth(nextMoveInDate.getMonth() + 1);

    const newEndDate = new Date(nextMoveInDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    // 7. Hitung Tarif Sewa
    const rentalAmount =
      existingBooking.room_type?.price_per_month ??
      existingBooking.property?.price_per_month ??
      existingBooking.amount ??
      0;

    // 8. Buat Booking Baru dengan Status PENDING
    // Catatan: TIDAK mengurangi available_rooms karena kamar fisik sudah ditempati oleh penyewa yang sama (occupancy retention)
    const newBooking = await prisma.booking.create({
      data: {
        property_id: existingBooking.property_id,
        room_type_id: existingBooking.room_type_id,
        student_name: existingBooking.student_name,
        student_whatsapp: existingBooking.student_whatsapp,
        move_in_date: nextMoveInDate,
        status: "PENDING",
        amount: rentalAmount,
        service_fee: existingBooking.service_fee || 5000,
        user_id: userPayload.userId,
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
        room_type: {
          select: {
            name: true,
          },
        },
      },
    });

    // 9. Kirim Notifikasi In-App
    await createInAppNotification({
      userId: userPayload.userId,
      title: "Permohonan Perpanjangan Sewa Berhasil",
      message: `Perpanjangan sewa untuk ${newBooking.property.name} telah dibuat. Silakan selesaikan pembayaran untuk mengamankan kamar Anda.`,
      type: "BOOKING_STATUS",
      link: `/checkout/${newBooking.id}`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        message: "Permohonan perpanjangan sewa berhasil dibuat.",
        data: {
          id: newBooking.id,
          checkoutUrl: `/checkout/${newBooking.id}`,
          moveInDate: newBooking.move_in_date,
          periodEndDate: newEndDate,
          amount: newBooking.amount,
          propertyName: newBooking.property.name,
          roomTypeName: newBooking.room_type?.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal memproses perpanjangan sewa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server saat memproses perpanjangan sewa.",
      },
      { status: 500 }
    );
  }
}
