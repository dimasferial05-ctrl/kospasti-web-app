import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePropertyPayload } from "@/lib/property-form-parser";

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
      is_pet_friendly,
      is_24_hours,
      description,
      rules,
      rental_terms,
      youtube_url,
      room_types,
      newMediaToCreate,
    } = parsed;

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
