import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter token diperlukan",
        },
        { status: 400 }
      );
    }

    const trimmedToken = token.trim();

    const magicLink = await prisma.magicLink.findUnique({
      where: { token: trimmedToken },
      include: {
        owner: {
          select: {
            name: true,
            properties: {
              select: {
                id: true,
                name: true,
                available_rooms: true,
              },
            },
          },
        },
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        {
          success: false,
          error: "Token tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (magicLink.is_used) {
      return NextResponse.json(
        {
          success: false,
          error: "Token sudah pernah digunakan",
        },
        { status: 401 }
      );
    }

    if (new Date() > magicLink.expires_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Token sudah kedaluwarsa",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token valid",
        data: {
          ownerName: magicLink.owner.name,
          properties: magicLink.owner.properties,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating magic link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
