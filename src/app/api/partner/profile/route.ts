import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyOwnerToken, signOwnerToken } from "@/lib/auth";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_AVATAR_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

async function getPartnerToken(request?: NextRequest): Promise<string | undefined> {
  let token: string | undefined;
  if (request && "cookies" in request) {
    token = request.cookies.get("partner_token")?.value;
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("partner_token")?.value;
    } catch {
      // outside request store scope
    }
  }
  return token;
}

/**
 * GET: Mengambil detail profil mitra saat ini
 */
export async function GET(request?: NextRequest) {
  try {
    const partnerToken = await getPartnerToken(request);

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp_number: true,
        avatar_url: true,
        created_at: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: "Data mitra tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          whatsapp_number: owner.whatsapp_number,
          avatar_url: owner.avatar_url,
          total_properties: owner._count.properties,
          created_at: owner.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil profil mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memuat profil." },
      { status: 500 }
    );
  }
}

/**
 * PUT: Memperbarui profil mitra (Nama, WhatsApp, Foto Avatar)
 */
export async function PUT(request: NextRequest) {
  try {
    const partnerToken = await getPartnerToken(request);

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Anda harus login sebagai mitra." },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const currentOwner = await prisma.owner.findUnique({
      where: { id: payload.ownerId },
      select: { id: true, name: true, email: true, whatsapp_number: true, avatar_url: true },
    });

    if (!currentOwner) {
      return NextResponse.json(
        { success: false, error: "Data mitra tidak ditemukan." },
        { status: 404 }
      );
    }

    let rawName: string | undefined;
    let rawWhatsapp: string | undefined;
    let shouldRemoveAvatar = false;
    let avatarFile: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const nameVal = formData.get("name");
      const whatsappVal = formData.get("whatsapp_number") || formData.get("whatsapp");
      const removeAvatarVal = formData.get("remove_avatar");
      const fileVal = formData.get("avatar");

      if (typeof nameVal === "string") rawName = nameVal.trim();
      if (typeof whatsappVal === "string") rawWhatsapp = whatsappVal.trim();
      if (removeAvatarVal === "true" || removeAvatarVal === "1") {
        shouldRemoveAvatar = true;
      }

      if (fileVal instanceof File && fileVal.size > 0) {
        avatarFile = fileVal;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: "Format data request tidak valid." },
          { status: 400 }
        );
      }
      if (typeof body.name === "string") rawName = body.name.trim();
      if (typeof body.whatsapp_number === "string") {
        rawWhatsapp = body.whatsapp_number.trim();
      } else if (typeof body.whatsapp === "string") {
        rawWhatsapp = body.whatsapp.trim();
      }
      if (body.remove_avatar === true) {
        shouldRemoveAvatar = true;
      }
    }

    // 1. Validasi Nama
    if (rawName !== undefined) {
      if (rawName.length < 2) {
        return NextResponse.json(
          { success: false, error: "Nama pengelola kos minimal 2 karakter." },
          { status: 400 }
        );
      }
      if (rawName.length > 100) {
        return NextResponse.json(
          { success: false, error: "Nama pengelola kos tidak boleh melebihi 100 karakter." },
          { status: 400 }
        );
      }
    }

    // 2. Validasi Nomor WhatsApp
    if (rawWhatsapp !== undefined) {
      if (!rawWhatsapp) {
        return NextResponse.json(
          { success: false, error: "Nomor WhatsApp wajib diisi." },
          { status: 400 }
        );
      }
      if (rawWhatsapp.length > 16) {
        return NextResponse.json(
          { success: false, error: "Nomor WhatsApp tidak boleh melebihi 16 karakter." },
          { status: 400 }
        );
      }

      const waRegex = /^(?:\+62|62|0)8[0-9]{8,12}$/;
      if (!waRegex.test(rawWhatsapp)) {
        return NextResponse.json(
          {
            success: false,
            error: "Format nomor WhatsApp tidak valid. Gunakan format seperti 08123456789 atau +628123456789.",
          },
          { status: 400 }
        );
      }

      // Cek apakah nomor WhatsApp sudah dipakai mitra lain
      const existingOwnerWithWa = await prisma.owner.findFirst({
        where: {
          whatsapp_number: rawWhatsapp,
          id: { not: payload.ownerId },
        },
      });

      if (existingOwnerWithWa) {
        return NextResponse.json(
          {
            success: false,
            error: "Nomor WhatsApp ini sudah terdaftar oleh akun mitra lain.",
          },
          { status: 400 }
        );
      }
    }

    // 3. Validasi & Simpan File Avatar jika diunggah
    let newAvatarUrl: string | null | undefined;

    if (avatarFile) {
      if (avatarFile.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          { success: false, error: "Ukuran file foto profil tidak boleh melebihi 2MB." },
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

      const uploadResult = await saveUploadedFile(avatarFile, "avatars");
      newAvatarUrl = uploadResult.url;

      // Hapus avatar lama jika tersimpan di uploads lokal
      if (currentOwner.avatar_url && currentOwner.avatar_url.startsWith("/uploads/avatars/")) {
        await deleteUploadedFile(currentOwner.avatar_url);
      }
    } else if (shouldRemoveAvatar) {
      newAvatarUrl = null;
      if (currentOwner.avatar_url && currentOwner.avatar_url.startsWith("/uploads/avatars/")) {
        await deleteUploadedFile(currentOwner.avatar_url);
      }
    }

    // 4. Update Database
    const updatedOwner = await prisma.owner.update({
      where: { id: payload.ownerId },
      data: {
        ...(rawName !== undefined ? { name: rawName } : {}),
        ...(rawWhatsapp !== undefined ? { whatsapp_number: rawWhatsapp } : {}),
        ...(newAvatarUrl !== undefined ? { avatar_url: newAvatarUrl } : {}),
      },
    });

    // 5. Perbarui Sesi Token JWT Mitra
    const newSessionToken = await signOwnerToken({
      ownerId: updatedOwner.id,
      email: updatedOwner.email,
      name: updatedOwner.name,
      whatsapp_number: updatedOwner.whatsapp_number,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Profil mitra berhasil diperbarui.",
        data: {
          id: updatedOwner.id,
          name: updatedOwner.name,
          email: updatedOwner.email,
          whatsapp_number: updatedOwner.whatsapp_number,
          avatar_url: updatedOwner.avatar_url,
        },
      },
      { status: 200 }
    );

    response.cookies.set("partner_token", newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error("Gagal memperbarui profil mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memperbarui profil." },
      { status: 500 }
    );
  }
}
