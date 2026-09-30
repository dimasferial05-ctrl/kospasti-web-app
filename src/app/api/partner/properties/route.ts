import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFiles, saveUploadedFile, detectMediaType } from "@/lib/upload";

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

    const contentType = request.headers.get("content-type") || "";

    let name: string | undefined;
    let price_per_month: number | string | undefined;
    let available_rooms: number | string | undefined;
    let gender_type: string | undefined;
    let facilities: string | undefined;
    let image_url: string | null | undefined;
    let address: string | null | undefined;
    let latitude: number | string | null | undefined;
    let longitude: number | string | null | undefined;
    let is_pet_friendly: boolean = false;
    let is_24_hours: boolean = false;
    let description: string | null | undefined;
    let rules: string | null | undefined;
    let rental_terms: string | null | undefined;
    let youtube_url: string | null | undefined;
    let room_types: Array<{
      name: string;
      price_per_month: number;
      available_rooms: number;
      facilities?: string | null;
      specifications?: string | null;
      image_url?: string | null;
    }> = [];
    const mediaToCreate: { url: string; type: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string) || undefined;
      price_per_month = formData.get("price_per_month") as string | undefined;
      available_rooms = formData.get("available_rooms") as string | undefined;
      gender_type = (formData.get("gender_type") as string) || undefined;
      facilities = (formData.get("facilities") as string) || undefined;
      image_url = (formData.get("image_url") as string) || null;
      address = (formData.get("address") as string) || null;
      latitude = formData.get("latitude") as string | undefined;
      longitude = formData.get("longitude") as string | undefined;
      description = (formData.get("description") as string) || null;
      rules = (formData.get("rules") as string) || null;
      rental_terms = (formData.get("rental_terms") as string) || null;
      youtube_url = (formData.get("youtube_url") as string) || null;
      is_pet_friendly =
        formData.get("is_pet_friendly") === "true" ||
        formData.get("is_pet_friendly") === "1";
      is_24_hours =
        formData.get("is_24_hours") === "true" ||
        formData.get("is_24_hours") === "1";

      const rawRoomTypes = formData.get("room_types") as string | null;
      if (rawRoomTypes) {
        try {
          const parsed = JSON.parse(rawRoomTypes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (let i = 0; i < parsed.length; i++) {
              const rt = parsed[i];
              let rtImageUrl = rt.image_url ? String(rt.image_url).trim() : null;

              // Cek file foto tipe kamar
              const rtFile = formData.get(`room_type_file_${i}`);
              if (rtFile && typeof rtFile === "object" && "arrayBuffer" in rtFile && (rtFile as File).size > 0) {
                const saved = await saveUploadedFile(rtFile as File, "properties");
                rtImageUrl = saved.url;
              }

              room_types.push({
                name: String(rt.name || "Standar").trim(),
                price_per_month: Math.floor(Number(rt.price_per_month || 0)),
                available_rooms: Math.floor(Number(rt.available_rooms || 0)),
                facilities: rt.facilities ? String(rt.facilities).trim() : null,
                specifications: rt.specifications ? String(rt.specifications).trim() : null,
                image_url: rtImageUrl,
              });
            }
          }
        } catch (err) {
          console.warn("Gagal parsing room_types formData:", err);
        }
      }

      // Media upload files
      const filesFromMedia = formData.getAll("media");
      const filesFromFiles = formData.getAll("files");
      const allRawFiles = [...filesFromMedia, ...filesFromFiles];

      const validFiles: File[] = [];
      for (const item of allRawFiles) {
        if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
          validFiles.push(item as File);
        } else if (typeof item === "string" && item.trim()) {
          mediaToCreate.push({
            url: item.trim(),
            type: detectMediaType(undefined, item.trim()),
          });
        }
      }

      if (validFiles.length > 0) {
        const saved = await saveUploadedFiles(validFiles);
        for (const item of saved) {
          mediaToCreate.push(item);
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: "Data properti tidak valid." },
          { status: 400 }
        );
      }

      name = body.name;
      price_per_month = body.price_per_month;
      available_rooms = body.available_rooms;
      gender_type = body.gender_type;
      facilities = body.facilities;
      image_url = body.image_url;
      address = body.address;
      latitude = body.latitude;
      longitude = body.longitude;
      description = body.description;
      rules = body.rules;
      rental_terms = body.rental_terms;
      youtube_url = body.youtube_url;
      is_pet_friendly = Boolean(body.is_pet_friendly);
      is_24_hours = Boolean(body.is_24_hours);

      if (Array.isArray(body.room_types) && body.room_types.length > 0) {
        room_types = body.room_types.map((rt: { name?: string; price_per_month?: number | string; available_rooms?: number | string; facilities?: string; specifications?: string; image_url?: string }) => ({
          name: String(rt.name || "Standar").trim(),
          price_per_month: Math.floor(Number(rt.price_per_month || 0)),
          available_rooms: Math.floor(Number(rt.available_rooms || 0)),
          facilities: rt.facilities ? String(rt.facilities).trim() : null,
          specifications: rt.specifications ? String(rt.specifications).trim() : null,
          image_url: rt.image_url ? String(rt.image_url).trim() : null,
        }));
      }

      if (Array.isArray(body.media)) {
        for (const m of body.media) {
          if (typeof m === "string" && m.trim()) {
            mediaToCreate.push({
              url: m.trim(),
              type: detectMediaType(undefined, m.trim()),
            });
          } else if (m && typeof m === "object" && m.url) {
            mediaToCreate.push({
              url: String(m.url).trim(),
              type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
            });
          }
        }
      }
    }

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
