import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.ownerId || typeof body.ownerId !== "string" || !body.ownerId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ownerId diperlukan",
        },
        { status: 400 }
      );
    }

    const ownerId = body.ownerId.trim();

    // Verify owner exists in database
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          error: "Owner tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate unique random token
    const token = crypto.randomBytes(32).toString("hex");

    // Invalidate any existing unused tokens for this owner to ensure only one active token
    await prisma.magicLink.updateMany({
      where: {
        owner_id: owner.id,
        is_used: false,
      },
      data: {
        is_used: true,
      },
    });

    // Save to database
    await prisma.magicLink.create({
      data: {
        token,
        expires_at: expiresAt,
        owner_id: owner.id,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/update/${token}`;

    return NextResponse.json(
      {
        success: true,
        magicLink,
        expiresAt: expiresAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating magic link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 }
    );
  }
}
