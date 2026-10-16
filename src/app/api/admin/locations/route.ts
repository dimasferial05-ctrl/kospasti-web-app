import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  return Boolean(token);
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.LocationWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { aliases: { contains: search, mode: "insensitive" } },
        { subdistrict: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category !== "ALL") {
      whereClause.category = category;
    }

    if (status === "ACTIVE") {
      whereClause.is_active = true;
    } else if (status === "INACTIVE") {
      whereClause.is_active = false;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where: whereClause,
        orderBy: { updated_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.location.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data lokasi admin:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data lokasi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Token admin tidak valid." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, category, latitude, longitude, aliases, subdistrict, is_active } = body;

    // Validasi input
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Nama lokasi minimal 2 karakter" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { success: false, error: "Kategori lokasi wajib dipilih" },
        { status: 400 }
      );
    }

    const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
    const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: "Koordinat latitude & longitude tidak valid" },
        { status: 400 }
      );
    }

    const newLocation = await prisma.location.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        latitude: lat,
        longitude: lng,
        aliases: typeof aliases === "string" && aliases.trim() ? aliases.trim() : null,
        subdistrict: typeof subdistrict === "string" && subdistrict.trim() ? subdistrict.trim() : null,
        is_active: typeof is_active === "boolean" ? is_active : true,
      },
    });

    return NextResponse.json(
      { success: true, data: newLocation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambahkan lokasi baru:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan lokasi baru" },
      { status: 500 }
    );
  }
}
