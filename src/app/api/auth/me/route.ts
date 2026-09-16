import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/auth";

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
    if (!payload) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          whatsapp: payload.whatsapp ?? null,
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
