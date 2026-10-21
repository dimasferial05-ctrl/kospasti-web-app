import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectMediaType } from "@/lib/upload";
import { parsePropertyPayload } from "@/lib/property-form-parser";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const properties = await prisma.property.findMany({
      where: { owner_id: payload.ownerId },
      orderBy: { created_at: "desc" },
      include: {
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        properties,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil properti mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar properti." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const parsed = await parsePropertyPayload(request);
    const {
      name,
      price_per_month,
      available_rooms,
      gender_type,
      facilities,
      image_url,
      address,
      latitude,
      longitude,
      description,
      rules,
      rental_terms,
      youtube_url,
      room_types = [],
      newMediaToCreate = [],
    } = parsed;

    const is_pet_friendly = Boolean(parsed.is_pet_friendly);
    const is_24_hours = Boolean(parsed.is_24_hours);
    const mediaToCreate = [...newMediaToCreate];

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama kos wajib diisi." },
        { status: 400 }
      );
    }

    const validGenders = ["PUTRA", "PUTRI", "CAMPUR"];
    const cleanGender = String(gender_type || "").toUpperCase();
    if (!validGenders.includes(cleanGender)) {
      return NextResponse.json(
        { success: false, error: "Tipe kos harus PUTRA, PUTRI, atau CAMPUR." },
        { status: 400 }
      );
    }

    let finalPrice = Number(price_per_month) || 0;
    let finalRooms = Number(available_rooms) || 0;

    if (room_types.length > 0) {
      finalPrice = Math.min(...room_types.map((rt) => rt.price_per_month));
      finalRooms = room_types.reduce((sum, rt) => sum + rt.available_rooms, 0);
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
      (image_url ? String(image_url).trim() : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80");

    let parsedLatitude: number | null = null;
    if (latitude !== undefined && latitude !== null && String(latitude).trim() !== "") {
      const parsed = parseFloat(String(latitude));
      if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
        parsedLatitude = parsed;
      }
    }

    let parsedLongitude: number | null = null;
    if (longitude !== undefined && longitude !== null && String(longitude).trim() !== "") {
      const parsed = parseFloat(String(longitude));
      if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
        parsedLongitude = parsed;
      }
    }

    const newProperty = await prisma.property.create({
      data: {
        name: name.trim(),
        price_per_month: Math.floor(finalPrice),
        available_rooms: Math.max(0, Math.floor(finalRooms)),
        gender_type: cleanGender,
        facilities: typeof facilities === "string" && facilities.trim() ? facilities.trim() : "WiFi, Kasur, Lemari, Kamar Mandi",
        image_url: firstImageUrl,
        address: address ? String(address).trim() : null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        owner_id: payload.ownerId,
        status: "PENDING_REVIEW",
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
                    price_per_month: Math.floor(finalPrice),
                    available_rooms: Math.max(0, Math.floor(finalRooms)),
                    facilities: typeof facilities === "string" && facilities.trim() ? facilities.trim() : "Kasur, Lemari",
                    specifications: null,
                  },
                ],
        },
      },
      include: {
        media: true,
        room_types: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Properti baru berhasil ditambahkan.",
        property: newProperty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambah properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan properti kos." },
      { status: 500 }
    );
  }
}
