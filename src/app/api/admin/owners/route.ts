import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function validateAdminAuth(request: NextRequest): boolean {
  const adminToken = request.cookies.get("admin_token")?.value;
  const validToken = process.env.ADMIN_TOKEN || "kospasti_admin_authenticated";
  return Boolean(adminToken && adminToken === validToken);
}

const WA_REGEX = /^[0-9+]{8,15}$/;

export async function GET(request: NextRequest) {
  try {
    if (!validateAdminAuth(request)) {
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

    const owners = await prisma.owner.findMany({
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: owners,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data pemilik admin:", error);
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
    if (!validateAdminAuth(request)) {
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

    const body = await request.json();
    const { name, whatsapp_number } = body || {};

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Nama pemilik wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !whatsapp_number ||
      typeof whatsapp_number !== "string" ||
      whatsapp_number.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    const trimmedName = name.trim();
    const trimmedWhatsapp = whatsapp_number.trim();

    if (!WA_REGEX.test(trimmedWhatsapp)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format nomor WhatsApp tidak valid. Gunakan 8-15 digit angka atau format internasional (+62...).",
        },
        {
          status: 400,
        }
      );
    }

    // Cek duplikasi nomor whatsapp
    const existingOwner = await prisma.owner.findUnique({
      where: {
        whatsapp_number: trimmedWhatsapp,
      },
    });

    if (existingOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp sudah terdaftar.",
        },
        {
          status: 409,
        }
      );
    }

    const newOwner = await prisma.owner.create({
      data: {
        name: trimmedName,
        whatsapp_number: trimmedWhatsapp,
      },
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newOwner,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal menambahkan pemilik:", error);
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

