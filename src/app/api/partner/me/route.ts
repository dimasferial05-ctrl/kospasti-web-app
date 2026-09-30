import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { authenticated: false, owner: null },
        { status: 200 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      const response = NextResponse.json(
        { authenticated: false, owner: null },
        { status: 200 }
      );
      response.cookies.delete("partner_token");
      return response;
    }

    const owner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp_number: true,
        created_at: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!owner) {
      const response = NextResponse.json(
        { authenticated: false, owner: null },
        { status: 200 }
      );
      response.cookies.delete("partner_token");
      return response;
    }

    return NextResponse.json(
      {
        authenticated: true,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          whatsapp_number: owner.whatsapp_number,
          total_properties: owner._count.properties,
          created_at: owner.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memeriksa sesi mitra:", error);
    return NextResponse.json(
      { authenticated: false, owner: null },
      { status: 500 }
    );
  }
}
