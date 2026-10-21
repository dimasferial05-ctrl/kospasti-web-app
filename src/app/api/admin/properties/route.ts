import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectMediaType } from "@/lib/upload";
import { parsePropertyPayload } from "@/lib/property-form-parser";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
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
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
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
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const parsed = await parsePropertyPayload(request);
    const {
      name,
      gender_type,
      facilities,
      image_url,
      address,
      latitude,
      longitude,
      owner_id,
      description,
      rules,
      rental_terms,
      youtube_url,
      room_types = [],
      newMediaToCreate = [],
    } = parsed;

    let price_per_month = parsed.price_per_month;
    let available_rooms = parsed.available_rooms;
    const is_pet_friendly = Boolean(parsed.is_pet_friendly);
    const is_24_hours = Boolean(parsed.is_24_hours);
    const mediaToCreate = [...newMediaToCreate];

    if (room_types.length > 0) {
      if (price_per_month === undefined || price_per_month === null || isNaN(Number(price_per_month)) || Number(price_per_month) <= 0) {
        price_per_month = Math.min(...room_types.map((rt) => rt.price_per_month));
      }
      if (available_rooms === undefined || available_rooms === null || isNaN(Number(available_rooms)) || Number(available_rooms) < 0) {
        available_rooms = room_types.reduce((sum, rt) => sum + rt.available_rooms, 0);
      }
    }

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

    if (image_url && typeof image_url === "string" && image_url.trim()) {
      const trimmedUrl = image_url.trim();
      if (!mediaToCreate.some((m) => m.url === trimmedUrl)) {
        mediaToCreate.push({
          url: trimmedUrl,
          type: detectMediaType(undefined, trimmedUrl),
        });
      }
    }

    const firstImageUrl =
      mediaToCreate.find((m) => m.type === "IMAGE")?.url ||
      mediaToCreate[0]?.url ||
      (image_url ? String(image_url).trim() : null);

    let parsedLatitude: number | null = null;
    if (latitude !== undefined && latitude !== null && String(latitude).trim() !== "") {
      const parsed = parseFloat(String(latitude));
      if (isNaN(parsed) || parsed < -90 || parsed > 90) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Latitude harus berupa angka antara -90 dan 90.",
          },
          {
            status: 400,
          }
        );
      }
      parsedLatitude = parsed;
    }

    let parsedLongitude: number | null = null;
    if (longitude !== undefined && longitude !== null && String(longitude).trim() !== "") {
      const parsed = parseFloat(String(longitude));
      if (isNaN(parsed) || parsed < -180 || parsed > 180) {
        return NextResponse.json(
          {
            success: false,
            error: "Bad Request: Longitude harus berupa angka antara -180 dan 180.",
          },
          {
            status: 400,
          }
        );
      }
      parsedLongitude = parsed;
    }

    const newProperty = await prisma.property.create({
      data: {
        name: name.trim(),
        price_per_month: Math.floor(Number(price_per_month)),
        available_rooms: Math.floor(Number(available_rooms)),
        gender_type: String(gender_type).toUpperCase(),
        facilities: facilities.trim(),
        image_url: firstImageUrl,
        address: address ? String(address).trim() : null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        owner_id: owner_id.trim(),
        status: "PUBLISHED",
        is_pet_friendly: is_pet_friendly,
        is_24_hours: is_24_hours,
        description: description ? String(description).trim() : null,
        rules: rules ? String(rules).trim() : null,
        rental_terms: rental_terms ? String(rental_terms).trim() : null,
        youtube_url: youtube_url ? String(youtube_url).trim() : null,
        media: {
          create: mediaToCreate,
        },
        room_types: {
          create:
            room_types.length > 0
              ? room_types
              : [
                  {
                    name: "Standar",
                    price_per_month: Math.floor(Number(price_per_month)),
                    available_rooms: Math.floor(Number(available_rooms)),
                    facilities: facilities.trim(),
                    specifications: null,
                  },
                ],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
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
