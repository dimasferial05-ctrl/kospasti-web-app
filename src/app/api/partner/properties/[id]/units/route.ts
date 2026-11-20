import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    const ownerId = payload?.ownerId || (payload as any)?.id;
    if (!payload || !ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Pastikan properti adalah milik mitra yang sedang login
    const property = await prisma.property.findFirst({
      where: {
        id,
        owner_id: ownerId,
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Properti tidak ditemukan atau Anda tidak memiliki akses ke properti ini.",
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.toUpperCase();
    const roomTypeIdFilter = searchParams.get("roomTypeId");

    const whereClause: Record<string, any> = {
      property_id: id,
    };

    if (statusFilter && ["VACANT", "OCCUPIED", "MAINTENANCE"].includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    if (roomTypeIdFilter) {
      whereClause.room_type_id = roomTypeIdFilter;
    }

    const units = await prisma.roomUnit.findMany({
      where: whereClause,
      include: {
        room_type: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
          },
        },
        bookings: {
          where: {
            status: { in: ["APPROVED", "ACCEPTED", "COMPLETED", "PAID"] },
          },
          select: {
            id: true,
            student_name: true,
            student_whatsapp: true,
            move_in_date: true,
            status: true,
          },
          take: 1,
        },
      },
      orderBy: [
        { floor: "asc" },
        { unit_number: "asc" },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: units,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil inventaris unit kamar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mengambil data unit kamar.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const partnerToken =
      cookieStore.get("partner_token")?.value || cookieStore.get("owner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    const ownerId = payload?.ownerId || (payload as any)?.id;
    if (!payload || !ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const property = await prisma.property.findFirst({
      where: {
        id,
        owner_id: ownerId,
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Properti tidak ditemukan atau Anda tidak memiliki akses ke properti ini.",
        },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const unitNumber = body?.unit_number?.toString()?.trim();
    const floor = Number.isInteger(body?.floor) ? body.floor : 1;
    const roomTypeId = body?.room_type_id?.toString()?.trim();
    const notes = body?.notes?.toString()?.trim() || null;

    if (!unitNumber) {
      return NextResponse.json(
        { success: false, error: "Nomor unit kamar wajib diisi." },
        { status: 400 }
      );
    }

    if (!roomTypeId) {
      return NextResponse.json(
        { success: false, error: "Tipe kamar (room_type_id) wajib dipilih." },
        { status: 400 }
      );
    }

    // Validasi bahwa room_type milik properti ini
    const roomType = await prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        property_id: id,
      },
    });

    if (!roomType) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipe kamar tidak valid atau tidak terdaftar pada properti ini.",
        },
        { status: 400 }
      );
    }

    // Cek duplikasi nomor kamar pada properti ini
    const existingUnit = await prisma.roomUnit.findFirst({
      where: {
        property_id: id,
        unit_number: unitNumber,
      },
    });

    if (existingUnit) {
      return NextResponse.json(
        {
          success: false,
          error: `Nomor kamar '${unitNumber}' sudah terdaftar pada kos ini. Harap gunakan nomor kamar yang berbeda.`,
        },
        { status: 400 }
      );
    }

    const createdUnit = await prisma.roomUnit.create({
      data: {
        property_id: id,
        room_type_id: roomTypeId,
        unit_number: unitNumber,
        floor: floor,
        status: "VACANT",
        notes: notes,
      },
      include: {
        room_type: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Kamar nomor '${unitNumber}' berhasil ditambahkan ke inventaris.`,
        data: createdUnit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambahkan unit kamar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menambahkan unit kamar.",
      },
      { status: 500 }
    );
  }
}
