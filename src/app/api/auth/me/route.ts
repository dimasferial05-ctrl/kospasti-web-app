import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload || !payload.userId) {
      const response = NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
      response.cookies.delete("user_token");
      return response;
    }

    // Verifikasi keberadaan user di database agar token lama/stale yang sudah dihapus/diseed tidak dianggap login
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        avatar: true,
        bio: true,
      },
    });

    if (!dbUser) {
      const response = NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
      response.cookies.delete("user_token");
      return response;
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          whatsapp: dbUser.whatsapp ?? null,
          avatar: dbUser.avatar ?? null,
          bio: dbUser.bio ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memeriksa sesi user:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
