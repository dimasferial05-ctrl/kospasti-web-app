import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFiles, saveUploadedFile, detectMediaType } from "@/lib/upload";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const property = await prisma.property.findFirst({
      where: {
        id,
        owner_id: payload.ownerId,
      },
      include: {
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
        bookings: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, property }, { status: 200 });
  } catch (error) {
    console.error("Gagal mengambil detail properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail properti." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const existing = await prisma.property.findFirst({
      where: {
        id,
        owner_id: payload.ownerId,
      },
      include: { media: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
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
    let is_pet_friendly: boolean | undefined;
    let is_24_hours: boolean | undefined;
    let description: string | null | undefined;
    let rules: string | null | undefined;
    let rental_terms: string | null | undefined;
    let youtube_url: string | null | undefined;
    let room_types:
      | Array<{
          id?: string;
          name: string;
          price_per_month: number;
          available_rooms: number;
          facilities: string | null;
          specifications: string | null;
          image_url?: string | null;
        }>
      | undefined;
    const newMediaToCreate: { url: string; type: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      if (formData.has("name")) name = (formData.get("name") as string) ?? undefined;
      if (formData.has("price_per_month"))
        price_per_month = (formData.get("price_per_month") as string) ?? undefined;
      if (formData.has("available_rooms"))
        available_rooms = (formData.get("available_rooms") as string) ?? undefined;
      if (formData.has("gender_type"))
        gender_type = (formData.get("gender_type") as string) ?? undefined;
      if (formData.has("facilities"))
        facilities = (formData.get("facilities") as string) ?? undefined;
      if (formData.has("image_url"))
        image_url = (formData.get("image_url") as string) ?? null;
      if (formData.has("address"))
        address = (formData.get("address") as string) ?? null;
      if (formData.has("latitude"))
        latitude = formData.get("latitude") as string | undefined;
      if (formData.has("longitude"))
        longitude = formData.get("longitude") as string | undefined;
      if (formData.has("description"))
        description = (formData.get("description") as string) ?? null;
      if (formData.has("rules"))
        rules = (formData.get("rules") as string) ?? null;
      if (formData.has("rental_terms"))
        rental_terms = (formData.get("rental_terms") as string) ?? null;
      if (formData.has("youtube_url"))
        youtube_url = (formData.get("youtube_url") as string) ?? null;
      if (formData.has("is_pet_friendly")) {
        const val = formData.get("is_pet_friendly");
        is_pet_friendly = val === "true" || val === "1";
      }
      if (formData.has("is_24_hours")) {
        const val = formData.get("is_24_hours");
        is_24_hours = val === "true" || val === "1";
      }

      if (formData.has("room_types")) {
        const raw = formData.get("room_types") as string;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            room_types = [];
            for (let i = 0; i < parsed.length; i++) {
              const rt = parsed[i];
              let rtImageUrl = rt.image_url ? String(rt.image_url).trim() : null;

              const rtFile = formData.get(`room_type_file_${i}`);
              if (rtFile && typeof rtFile === "object" && "arrayBuffer" in rtFile && (rtFile as File).size > 0) {
                const saved = await saveUploadedFile(rtFile as File, "properties");
                rtImageUrl = saved.url;
              }

              room_types.push({
                id: rt.id ? String(rt.id) : undefined,
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

      const filesFromMedia = formData.getAll("media");
      const filesFromFiles = formData.getAll("files");
      const allRawFiles = [...filesFromMedia, ...filesFromFiles];

      const validFiles: File[] = [];
      for (const item of allRawFiles) {
        if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
          validFiles.push(item as File);
        } else if (typeof item === "string" && item.trim()) {
          newMediaToCreate.push({
            url: item.trim(),
            type: detectMediaType(undefined, item.trim()),
          });
        }
      }

      if (validFiles.length > 0) {
        const saved = await saveUploadedFiles(validFiles);
        for (const item of saved) {
          newMediaToCreate.push(item);
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      name = body.name;
      price_per_month = body.price_per_month;
      available_rooms = body.available_rooms;
      gender_type = body.gender_type;
      facilities = body.facilities;
      image_url = body.image_url;
      address = body.address;
      latitude = body.latitude;
      longitude = body.longitude;
      if (body.description !== undefined) description = body.description;
      if (body.rules !== undefined) rules = body.rules;
      if (body.rental_terms !== undefined) rental_terms = body.rental_terms;
      if (body.youtube_url !== undefined) youtube_url = body.youtube_url;
      if (body.is_pet_friendly !== undefined) is_pet_friendly = Boolean(body.is_pet_friendly);
      if (body.is_24_hours !== undefined) is_24_hours = Boolean(body.is_24_hours);

      if (Array.isArray(body.room_types)) {
        room_types = body.room_types.map((rt: { id?: string; name?: string; price_per_month?: number | string; available_rooms?: number | string; facilities?: string; specifications?: string; image_url?: string }) => ({
          id: rt.id ? String(rt.id) : undefined,
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
            newMediaToCreate.push({
              url: m.trim(),
              type: detectMediaType(undefined, m.trim()),
            });
          } else if (m && typeof m === "object" && m.url) {
            newMediaToCreate.push({
              url: String(m.url).trim(),
              type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
            });
          }
        }
      }
    }

    const updateData: {
      name?: string;
      price_per_month?: number;
      available_rooms?: number;
      gender_type?: string;
      facilities?: string;
      image_url?: string | null;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      is_pet_friendly?: boolean;
      is_24_hours?: boolean;
      description?: string | null;
      rules?: string | null;
      rental_terms?: string | null;
      youtube_url?: string | null;
      status?: string;
      rejectionReason?: string | null;
      media?: {
        create?: { url: string; type: string }[];
      };
    } = {};

    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (gender_type !== undefined) updateData.gender_type = String(gender_type).toUpperCase();
    if (price_per_month !== undefined) updateData.price_per_month = Math.max(0, Number(price_per_month) || 0);
    if (available_rooms !== undefined) updateData.available_rooms = Math.max(0, Number(available_rooms) || 0);
    if (facilities !== undefined) {
      updateData.facilities = typeof facilities === "string" ? facilities.trim() : Array.isArray(facilities) ? (facilities as string[]).join(", ") : facilities;
    }
    if (address !== undefined) updateData.address = address ? String(address).trim() : null;
    if (latitude !== undefined) {
      if (latitude === null || String(latitude).trim() === "") {
        updateData.latitude = null;
      } else {
        const parsed = parseFloat(String(latitude));
        if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) updateData.latitude = parsed;
      }
    }
    if (longitude !== undefined) {
      if (longitude === null || String(longitude).trim() === "") {
        updateData.longitude = null;
      } else {
        const parsed = parseFloat(String(longitude));
        if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) updateData.longitude = parsed;
      }
    }
    if (is_pet_friendly !== undefined) updateData.is_pet_friendly = is_pet_friendly;
    if (is_24_hours !== undefined) updateData.is_24_hours = is_24_hours;
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (rules !== undefined) updateData.rules = rules ? String(rules).trim() : null;
    if (rental_terms !== undefined) updateData.rental_terms = rental_terms ? String(rental_terms).trim() : null;
    if (youtube_url !== undefined) updateData.youtube_url = youtube_url ? String(youtube_url).trim() : null;
    if (image_url !== undefined) updateData.image_url = image_url ? String(image_url).trim() : null;

    if (existing.status === "REJECTED") {
      updateData.status = "PENDING_REVIEW";
      updateData.rejectionReason = null;
    }

    if (newMediaToCreate.length > 0) {
      updateData.media = {
        create: newMediaToCreate,
      };
      if (image_url === undefined && !existing.image_url) {
        updateData.image_url =
          newMediaToCreate.find((m) => m.type === "IMAGE")?.url || newMediaToCreate[0]?.url;
      }
    }

    if (room_types && room_types.length > 0) {
      updateData.price_per_month = Math.min(...room_types.map((rt) => rt.price_per_month));
      updateData.available_rooms = room_types.reduce((sum, rt) => sum + rt.available_rooms, 0);

      await prisma.roomType.deleteMany({
        where: { property_id: id },
      });
      await prisma.roomType.createMany({
        data: room_types.map((rt) => ({
          property_id: id,
          name: rt.name,
          price_per_month: rt.price_per_month,
          available_rooms: rt.available_rooms,
          facilities: rt.facilities,
          specifications: rt.specifications,
          image_url: rt.image_url,
        })),
      });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        media: true,
        room_types: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Properti berhasil diperbarui.",
        property: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memperbarui properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data properti." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    const existing = await prisma.property.findFirst({
      where: {
        id,
        owner_id: payload.ownerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Properti berhasil dihapus." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal menghapus properti:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus properti." },
      { status: 500 }
    );
  }
}
