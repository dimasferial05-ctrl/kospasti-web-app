import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";
import {
  globalRateLimiter,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limiter";

const RATE_LIMIT_OPTIONS = {
  maxRequests: 5,
  windowMs: 5 * 60 * 1000, // 5 menit
  prefix: "magic-link",
};

export async function POST(request: Request) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const clientIp = getClientIp(request);
    const rateLimitResult = globalRateLimiter.check(clientIp, RATE_LIMIT_OPTIONS);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        `Terlalu banyak permintaan pembuatan Magic Link. Silakan coba lagi dalam ${rateLimitResult.retryAfterSeconds} detik.`
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !body.ownerId || typeof body.ownerId !== "string" || !body.ownerId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ownerId diperlukan",
        },
        {
          status: 400,
          headers: getRateLimitHeaders(rateLimitResult),
        }
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
        {
          status: 404,
          headers: getRateLimitHeaders(rateLimitResult),
        }
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
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
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
