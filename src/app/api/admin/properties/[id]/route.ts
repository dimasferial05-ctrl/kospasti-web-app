import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/upload";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";
import { parsePropertyPayload } from "@/lib/property-form-parser";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
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
      include: { media: true },
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
      owner_id,
      is_pet_friendly,
      is_24_hours,
      description,
      rules,
      rental_terms,
      youtube_url,
      room_types,
      newMediaToCreate,
    } = parsed;
    const room_types_data = room_types;

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
      owner_id?: string;
      is_pet_friendly?: boolean;
      is_24_hours?: boolean;
      description?: string | null;
      rules?: string | null;
      rental_terms?: string | null;
      youtube_url?: string | null;
      media?: {
        create?: { url: string; type: string }[];
      };
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

    if (address !== undefined) {
      updateData.address = address ? String(address).trim() : null;
    }

    if (latitude !== undefined) {
      if (latitude === null || String(latitude).trim() === "") {
        updateData.latitude = null;
      } else {
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
        updateData.latitude = parsed;
      }
    }

    if (longitude !== undefined) {
      if (longitude === null || String(longitude).trim() === "") {
        updateData.longitude = null;
      } else {
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
        updateData.longitude = parsed;
      }
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

    if (is_pet_friendly !== undefined) {
      updateData.is_pet_friendly = is_pet_friendly;
    }

    if (is_24_hours !== undefined) {
      updateData.is_24_hours = is_24_hours;
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (rules !== undefined) {
      updateData.rules = rules ? String(rules).trim() : null;
    }

    if (rental_terms !== undefined) {
      updateData.rental_terms = rental_terms ? String(rental_terms).trim() : null;
    }

    if (youtube_url !== undefined) {
      updateData.youtube_url = youtube_url ? String(youtube_url).trim() : null;
    }

    if (newMediaToCreate.length > 0) {
      updateData.media = {
        create: newMediaToCreate,
      };
      if (image_url === undefined && !existingProperty.image_url) {
        updateData.image_url =
          newMediaToCreate.find((m) => m.type === "IMAGE")?.url || newMediaToCreate[0]?.url;
      }
    }

    if (room_types_data && room_types_data.length > 0) {
      updateData.price_per_month = Math.min(...room_types_data.map((rt) => rt.price_per_month));
      updateData.available_rooms = room_types_data.reduce((sum, rt) => sum + rt.available_rooms, 0);

      // Re-sync room types for this property
      await prisma.roomType.deleteMany({
        where: { property_id: propertyId.trim() },
      });
      await prisma.roomType.createMany({
        data: room_types_data.map((rt) => ({
          property_id: propertyId.trim(),
          name: rt.name,
          price_per_month: rt.price_per_month,
          available_rooms: rt.available_rooms,
          facilities: rt.facilities,
          specifications: rt.specifications,
          image_url: rt.image_url,
        })),
      });
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
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const resolvedParams = await context.params;
    const propertyId = resolvedParams.id;

    if (!propertyId || typeof propertyId !== "string" || propertyId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Bad Request: ID properti tidak valid." },
        { status: 400 }
      );
    }

    // Cari properti beserta semua media-nya
    const property = await prisma.property.findUnique({
      where: { id: propertyId.trim() },
      include: { media: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus file fisik media dari storage server
    const deletedUrls = new Set<string>();
    for (const media of property.media) {
      if (media.url && !deletedUrls.has(media.url)) {
        await deleteUploadedFile(media.url);
        deletedUrls.add(media.url);
      }
    }
    // Hapus juga file image_url jika belum terhapus di atas
    if (property.image_url && !deletedUrls.has(property.image_url)) {
      await deleteUploadedFile(property.image_url);
    }

    // Hapus properti dari database (cascade akan hapus media & booking terkait)
    await prisma.property.delete({
      where: { id: propertyId.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal menghapus properti:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
