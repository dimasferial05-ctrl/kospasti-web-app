import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    const properties = await prisma.property.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data properti admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();
    const {
      name,
      price_per_month,
      available_rooms,
      gender_type,
      facilities,
      image_url,
      owner_id,
    } = body;

    // Validasi field wajib
    if (
      !name ||
      typeof name !== "string" ||
      name.trim() === "" ||
      price_per_month === undefined ||
      price_per_month === null ||
      isNaN(Number(price_per_month)) ||
      Number(price_per_month) <= 0 ||
      available_rooms === undefined ||
      available_rooms === null ||
      isNaN(Number(available_rooms)) ||
      Number(available_rooms) < 0 ||
      !gender_type ||
      !["PUTRA", "PUTRI", "CAMPUR"].includes(String(gender_type).toUpperCase()) ||
      !facilities ||
      typeof facilities !== "string" ||
      facilities.trim() === "" ||
      !owner_id ||
      typeof owner_id !== "string" ||
      owner_id.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bad Request: Data tidak lengkap atau format tidak valid (nama, harga, kamar, tipe kos, fasilitas, dan pemilik wajib diisi).",
        },
        {
          status: 400,
        }
      );
    }

    // Pastikan owner yang dipilih ada di database
    const owner = await prisma.owner.findUnique({
      where: { id: owner_id.trim() },
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          error: "Pemilik kos (Owner) tidak ditemukan.",
        },
        {
          status: 400,
        }
      );
    }

    const newProperty = await prisma.property.create({
      data: {
        name: name.trim(),
        price_per_month: Math.floor(Number(price_per_month)),
        available_rooms: Math.floor(Number(available_rooms)),
        gender_type: String(gender_type).toUpperCase(),
        facilities: facilities.trim(),
        image_url: image_url ? String(image_url).trim() : null,
        owner_id: owner_id.trim(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newProperty,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal menambahkan properti baru:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}
