import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFiles, detectMediaType } from "@/lib/upload";

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
        media: true,
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

    const contentType = request.headers.get("content-type") || "";

    let name: string | undefined;
    let price_per_month: number | string | undefined;
    let available_rooms: number | string | undefined;
    let gender_type: string | undefined;
    let facilities: string | undefined;
    let image_url: string | null | undefined;
    let owner_id: string | undefined;
    const mediaToCreate: { url: string; type: string }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string) || undefined;
      price_per_month = formData.get("price_per_month") as string | undefined;
      available_rooms = formData.get("available_rooms") as string | undefined;
      gender_type = (formData.get("gender_type") as string) || undefined;
      facilities = (formData.get("facilities") as string) || undefined;
      image_url = (formData.get("image_url") as string) || null;
      owner_id = (formData.get("owner_id") as string) || undefined;

      // Ambil file media yang diunggah
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
      const body = await request.json();
      name = body.name;
      price_per_month = body.price_per_month;
      available_rooms = body.available_rooms;
      gender_type = body.gender_type;
      facilities = body.facilities;
      image_url = body.image_url;
      owner_id = body.owner_id;

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

    const newProperty = await prisma.property.create({
      data: {
        name: name.trim(),
        price_per_month: Math.floor(Number(price_per_month)),
        available_rooms: Math.floor(Number(available_rooms)),
        gender_type: String(gender_type).toUpperCase(),
        facilities: facilities.trim(),
        image_url: firstImageUrl,
        owner_id: owner_id.trim(),
        media: {
          create: mediaToCreate,
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
