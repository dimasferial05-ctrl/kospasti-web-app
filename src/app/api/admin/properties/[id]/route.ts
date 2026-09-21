import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFiles, saveUploadedFile, detectMediaType, deleteUploadedFile } from "@/lib/upload";

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
    let owner_id: string | undefined;
    let is_pet_friendly: boolean | undefined;
    let is_24_hours: boolean | undefined;
    let room_types:
      | Array<{
          id?: string;
          name: string;
          price_per_month: number;
          available_rooms: number;
          facilities: string | null;
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
      if (formData.has("owner_id"))
        owner_id = (formData.get("owner_id") as string) ?? undefined;
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

              // Cek file foto tipe kamar yang diunggah
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
                image_url: rtImageUrl,
              });
            }
          }
        } catch (err) {
          console.warn("Gagal parsing room_types PATCH formData:", err);
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
      const body = await request.json();
      name = body.name;
      price_per_month = body.price_per_month;
      available_rooms = body.available_rooms;
      gender_type = body.gender_type;
      facilities = body.facilities;
      image_url = body.image_url;
      address = body.address;
      latitude = body.latitude;
      longitude = body.longitude;
      owner_id = body.owner_id;
      if (body.is_pet_friendly !== undefined) {
        is_pet_friendly = Boolean(body.is_pet_friendly);
      }
      if (body.is_24_hours !== undefined) {
        is_24_hours = Boolean(body.is_24_hours);
      }

      if (Array.isArray(body.room_types)) {
        room_types = body.room_types.map((rt: { id?: string; name?: string; price_per_month?: number | string; available_rooms?: number | string; facilities?: string; image_url?: string }) => ({
          id: rt.id ? String(rt.id) : undefined,
          name: String(rt.name || "Standar").trim(),
          price_per_month: Math.floor(Number(rt.price_per_month || 0)),
          available_rooms: Math.floor(Number(rt.available_rooms || 0)),
          facilities: rt.facilities ? String(rt.facilities).trim() : null,
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

    let room_types_data: typeof room_types = room_types;

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
      const existsInCurrentMedia = existingProperty.media.some(
        (m) => m.url === updateData.image_url
      );
      if (
        updateData.image_url &&
        !existsInCurrentMedia &&
        !newMediaToCreate.some((m) => m.url === updateData.image_url)
      ) {
        newMediaToCreate.push({
          url: updateData.image_url,
          type: detectMediaType(undefined, updateData.image_url),
        });
      }
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
    const adminToken = request.cookies.get("admin_token")?.value;
    const validToken = process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
    if (!adminToken || adminToken !== validToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        { status: 401 }
      );
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
