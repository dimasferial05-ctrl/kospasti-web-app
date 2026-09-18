import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyUserToken, signUserToken } from "@/lib/auth";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_AVATAR_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        bio: true,
        avatar: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil profil pengguna:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat mengambil data profil.",
      },
      { status: 500 }
    );
  }
}

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

    // Ambil data user lama untuk referensi
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, avatar: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengguna tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    let rawName: string | undefined;
    let rawWhatsapp = "";
    let rawBio: string | null | undefined;
    let avatarFile: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const nameVal = formData.get("name");
      const whatsappVal = formData.get("whatsapp");
      const bioVal = formData.get("bio");
      const fileVal = formData.get("avatar");

      if (typeof nameVal === "string") rawName = nameVal.trim();
      if (typeof whatsappVal === "string") rawWhatsapp = whatsappVal.trim();
      if (typeof bioVal === "string") rawBio = bioVal.trim();

      if (fileVal instanceof File && fileVal.size > 0) {
        avatarFile = fileVal;
      }
    } else {
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
      if (typeof body.name === "string") rawName = body.name.trim();
      if (typeof body.whatsapp === "string") rawWhatsapp = body.whatsapp.trim();
      if (typeof body.bio === "string") rawBio = body.bio.trim();
    }

    // Validasi Nama
    if (rawName !== undefined && rawName.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama lengkap tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    if (rawName && rawName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama lengkap tidak boleh melebihi 100 karakter.",
        },
        { status: 400 }
      );
    }

    // Validasi WhatsApp
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

    // Validasi Bio
    if (rawBio && rawBio.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error: "Bio singkat maksimal 150 karakter.",
        },
        { status: 400 }
      );
    }

    // Validasi & Simpan File Avatar jika diunggah
    let newAvatarUrl: string | undefined;
    if (avatarFile) {
      if (avatarFile.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: "Ukuran file foto profil tidak boleh melebihi 2MB.",
          },
          { status: 400 }
        );
      }

      const fileExt = path.extname(avatarFile.name || "").toLowerCase();
      const mimeType = (avatarFile.type || "").toLowerCase();

      if (!ALLOWED_AVATAR_TYPES.has(mimeType) && !ALLOWED_AVATAR_EXTS.has(fileExt)) {
        return NextResponse.json(
          {
            success: false,
            error: "Format file tidak didukung. Harap unggah foto dengan format JPG, PNG, atau WebP.",
          },
          { status: 400 }
        );
      }

      // Simpan file avatar
      const uploadResult = await saveUploadedFile(avatarFile, "avatars");
      newAvatarUrl = uploadResult.url;

      // Hapus avatar lama jika disimpan di server lokal kospasti
      if (currentUser.avatar && currentUser.avatar.startsWith("/uploads/avatars/")) {
        await deleteUploadedFile(currentUser.avatar);
      }
    }

    // Update data pengguna di database
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        whatsapp: rawWhatsapp,
        ...(rawName !== undefined ? { name: rawName } : {}),
        ...(rawBio !== undefined ? { bio: rawBio } : {}),
        ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}),
      },
    });

    // Terbitkan ulang JWT token yang telah diperbarui
    const newSessionToken = await signUserToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      whatsapp: updatedUser.whatsapp,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Profil berhasil diperbarui.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          whatsapp: updatedUser.whatsapp,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
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
