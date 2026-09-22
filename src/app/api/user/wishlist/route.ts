import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth";

/**
 * Helper untuk verifikasi autentikasi user
 */
async function authenticateUser() {
  const cookieStore = await cookies();
  const userToken = cookieStore.get("user_token")?.value;

  if (!userToken) {
    return null;
  }

  const payload = await verifyUserToken(userToken);
  return payload;
}

/**
 * GET /api/user/wishlist
 * Mengambil daftar kos yang disimpan/difavoritkan oleh user.
 * Query parameter:
 * - idsOnly=true: Hanya mengembalikan array of property_id
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateUser();
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsOnly = searchParams.get("idsOnly") === "true";

    if (idsOnly) {
      const saved = await prisma.savedProperty.findMany({
        where: {
          user_id: payload.userId,
        },
        select: {
          property_id: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          savedIds: saved.map((item) => item.property_id),
        },
        { status: 200 }
      );
    }

    const savedProperties = await prisma.savedProperty.findMany({
      where: {
        user_id: payload.userId,
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                whatsapp_number: true,
              },
            },
            room_types: true,
            media: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        savedProperties,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil data wishlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mengambil data favorit.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/wishlist
 * Menyimpan / menghapus kos dari daftar favorit (toggle atau explicit action).
 * Body: { propertyId: string, action?: "toggle" | "add" | "remove" }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateUser();
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu untuk menyimpan favorit.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const propertyId = body?.propertyId;
    const action = body?.action || "toggle";

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: propertyId wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Pastikan properti valid / ada di database
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found: Kos tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // Cek apakah sudah tersimpan
    const existingSave = await prisma.savedProperty.findUnique({
      where: {
        user_id_property_id: {
          user_id: payload.userId,
          property_id: propertyId,
        },
      },
    });

    if (action === "remove" || (action === "toggle" && existingSave)) {
      if (existingSave) {
        await prisma.savedProperty.delete({
          where: {
            id: existingSave.id,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          isSaved: false,
          message: `${property.name} dihapus dari daftar favorit.`,
        },
        { status: 200 }
      );
    } else {
      if (!existingSave) {
        await prisma.savedProperty.create({
          data: {
            user_id: payload.userId,
            property_id: propertyId,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          isSaved: true,
          message: `${property.name} berhasil disimpan ke favorit!`,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Gagal mengubah status favorit:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memperbarui daftar favorit.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/wishlist
 * Menghapus kos dari daftar favorit secara langsung.
 * Query param: ?propertyId=... atau body: { propertyId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const payload = await authenticateUser();
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      const body = await request.json().catch(() => null);
      propertyId = body?.propertyId;
    }

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request: propertyId wajib diisi.",
        },
        { status: 400 }
      );
    }

    await prisma.savedProperty.deleteMany({
      where: {
        user_id: payload.userId,
        property_id: propertyId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        isSaved: false,
        message: "Berhasil menghapus dari favorit.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal menghapus dari wishlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat menghapus favorit.",
      },
      { status: 500 }
    );
  }
}
