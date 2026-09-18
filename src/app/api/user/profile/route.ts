import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyUserToken, signUserToken } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Anda harus login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyUserToken(userToken);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Format data request tidak valid.",
        },
        { status: 400 }
      );
    }

    const rawWhatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
    const rawName = typeof body.name === "string" ? body.name.trim() : undefined;

    if (!rawWhatsapp) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (rawWhatsapp.length > 15) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp tidak boleh melebihi 15 karakter.",
        },
        { status: 400 }
      );
    }

    const waRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;
    if (!waRegex.test(rawWhatsapp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format nomor WhatsApp tidak valid. Gunakan format seperti 08123456789 atau +628123456789.",
        },
        { status: 400 }
      );
    }

    // Update data pengguna di database
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        whatsapp: rawWhatsapp,
        ...(rawName ? { name: rawName } : {}),
      },
    });

    // Terbitkan ulang JWT token yang telah diperbarui dengan nomor whatsapp baru
    const newSessionToken = await signUserToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      whatsapp: updatedUser.whatsapp,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Profil dan nomor WhatsApp berhasil diperbarui.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          whatsapp: updatedUser.whatsapp,
        },
      },
      { status: 200 }
    );

    // Pasang ulang Secure HTTP-Only Cookie
    response.cookies.set({
      name: "user_token",
      value: newSessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Gagal memperbarui profil pengguna:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat memperbarui data diri.",
      },
      { status: 500 }
    );
  }
}
