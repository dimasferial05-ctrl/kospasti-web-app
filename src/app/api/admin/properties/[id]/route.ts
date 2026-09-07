import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = await context.params;
    const propertyId = resolvedParams.id;

    if (!propertyId || typeof propertyId !== "string" || propertyId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: ID properti tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // Periksa apakah properti ada di database
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId.trim() },
    });

    if (!existingProperty) {
      return NextResponse.json(
        {
          success: false,
          error: "Properti tidak ditemukan.",
        },
        {
          status: 404,
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

    const updateData: {
      name?: string;
      price_per_month?: number;
      available_rooms?: number;
      gender_type?: string;
      facilities?: string;
      image_url?: string | null;
      owner_id?: string;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Nama properti tidak boleh kosong.",
          },
          {
            status: 400,
          }
        );
      }
      updateData.name = name.trim();
    }

    if (price_per_month !== undefined) {
      if (
        price_per_month === null ||
        isNaN(Number(price_per_month)) ||
        Number(price_per_month) <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Harga per bulan harus berupa angka lebih dari 0.",
          },
          {
            status: 400,
          }
        );
      }
      updateData.price_per_month = Math.floor(Number(price_per_month));
    }

    if (available_rooms !== undefined) {
      if (
        available_rooms === null ||
        isNaN(Number(available_rooms)) ||
        Number(available_rooms) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Jumlah kamar tersedia harus berupa angka >= 0.",
          },
          {
            status: 400,
          }
        );
      }
      updateData.available_rooms = Math.floor(Number(available_rooms));
    }

    if (gender_type !== undefined) {
      const upperGender = String(gender_type).toUpperCase();
      if (!["PUTRA", "PUTRI", "CAMPUR"].includes(upperGender)) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Tipe kos harus salah satu dari PUTRA, PUTRI, atau CAMPUR.",
          },
          {
            status: 400,
          }
        );
      }
      updateData.gender_type = upperGender;
    }

    if (facilities !== undefined) {
      if (typeof facilities !== "string" || facilities.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Fasilitas tidak boleh kosong.",
          },
          {
            status: 400,
          }
        );
      }
      updateData.facilities = facilities.trim();
    }

    if (image_url !== undefined) {
      updateData.image_url = image_url ? String(image_url).trim() : null;
    }

    if (owner_id !== undefined) {
      if (typeof owner_id !== "string" || owner_id.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: ID pemilik (owner_id) tidak boleh kosong.",
          },
          {
            status: 400,
          }
        );
      }

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

      updateData.owner_id = owner_id.trim();
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId.trim() },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedProperty,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal memperbarui properti:", error);
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
