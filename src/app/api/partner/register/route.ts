import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidPartnerPassword, PARTNER_PASSWORD_ERROR_MESSAGE } from "@/lib/auth";
import { saveUploadedFiles, detectMediaType, UploadedMediaResult } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    let name = "";
    let email = "";
    let password = "";
    let whatsapp_number = "";
    let propertyName = "";
    let address = "";
    let latitude: unknown = null;
    let longitude: unknown = null;
    let gender_type = "";
    let price_per_month: unknown = null;
    let available_rooms: unknown = null;
    let facilities: unknown = "";
    let rules: unknown = "";
    let image_url: string | null = null;
    let is_pet_friendly = false;
    let is_24_hours = true;
    const mediaFiles: File[] = [];
    const directMediaUrls: { url: string; type: "IMAGE" | "VIDEO" }[] = [];

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      const formData = await request.formData();
      name = String(formData.get("name") || "").trim();
      email = String(formData.get("email") || "").trim();
      password = String(formData.get("password") || "");
      whatsapp_number = String(formData.get("whatsapp_number") || "").trim();
      propertyName = String(formData.get("propertyName") || "").trim();
      address = String(formData.get("address") || "").trim();
      latitude = formData.get("latitude");
      longitude = formData.get("longitude");
      gender_type = String(formData.get("gender_type") || "").trim();
      price_per_month = formData.get("price_per_month");
      available_rooms = formData.get("available_rooms");
      facilities = formData.get("facilities");
      rules = formData.get("rules");
      image_url = formData.get("image_url") ? String(formData.get("image_url")).trim() : null;
      is_pet_friendly = formData.get("is_pet_friendly") === "true";
      is_24_hours = formData.get("is_24_hours") !== "false";

      const rawFiles = [...formData.getAll("media"), ...formData.getAll("files")];
      for (const item of rawFiles) {
        if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
          mediaFiles.push(item as File);
        } else if (typeof item === "string" && item.trim()) {
          directMediaUrls.push({
            url: item.trim(),
            type: detectMediaType(undefined, item.trim()),
          });
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: "Payload pendaftaran tidak valid." },
          { status: 400 }
        );
      }
      name = String(body.name || "").trim();
      email = String(body.email || "").trim();
      password = String(body.password || "");
      whatsapp_number = String(body.whatsapp_number || "").trim();
      propertyName = String(body.propertyName || "").trim();
      address = String(body.address || "").trim();
      latitude = body.latitude;
      longitude = body.longitude;
      gender_type = String(body.gender_type || "").trim();
      price_per_month = body.price_per_month;
      available_rooms = body.available_rooms;
      facilities = body.facilities;
      rules = body.rules;
      image_url = body.image_url ? String(body.image_url).trim() : null;
      is_pet_friendly = Boolean(body.is_pet_friendly);
      is_24_hours = body.is_24_hours !== false;
    }

    // 1. Validasi Akun Mitra
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap pemilik wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email?.trim?.()?.toLowerCase?.();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password wajib diisi." },
        { status: 400 }
      );
    }

    // Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka
    if (!isValidPartnerPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: PARTNER_PASSWORD_ERROR_MESSAGE,
        },
        { status: 400 }
      );
    }

    const cleanWa = String(whatsapp_number || "").replace(/\D/g, "");
    if (!cleanWa || cleanWa.length < 9 || cleanWa.length > 13) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp harus terdiri dari 9 hingga 13 digit angka.",
        },
        { status: 400 }
      );
    }

    // 2. Validasi Data Properti Perdana
    if (!propertyName || typeof propertyName !== "string" || !propertyName.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama kos wajib diisi." },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json(
        { success: false, error: "Alamat lengkap kos wajib diisi." },
        { status: 400 }
      );
    }

    const validGenders = ["PUTRA", "PUTRI", "CAMPUR"];
    const cleanGender = String(gender_type || "").toUpperCase();
    if (!validGenders.includes(cleanGender)) {
      return NextResponse.json(
        { success: false, error: "Tipe kos harus salah satu dari: PUTRA, PUTRI, atau CAMPUR." },
        { status: 400 }
      );
    }

    const priceNum = Number(price_per_month);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { success: false, error: "Harga per bulan harus berupa angka valid." },
        { status: 400 }
      );
    }

    const roomsNum = Number(available_rooms);
    if (isNaN(roomsNum) || roomsNum < 0) {
      return NextResponse.json(
        { success: false, error: "Jumlah kamar harus berupa angka valid." },
        { status: 400 }
      );
    }

    // 3. Validasi & Pengunggahan Media
    const uploadedMediaList: UploadedMediaResult[] = [...directMediaUrls];

    if (mediaFiles.length > 0) {
      const saved = await saveUploadedFiles(mediaFiles, "properties");
      uploadedMediaList.push(...saved);
    }

    if (image_url && !image_url.includes("images.unsplash.com")) {
      if (!uploadedMediaList.some((m) => m.url === image_url)) {
        uploadedMediaList.push({
          url: image_url,
          type: detectMediaType(undefined, image_url),
        });
      }
    }

    if (uploadedMediaList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Wajib mengunggah minimal 1 foto properti kos untuk verifikasi." },
        { status: 400 }
      );
    }

    const firstImage = uploadedMediaList.find((m) => m.type === "IMAGE") || uploadedMediaList[0];
    const mainThumbnailUrl = firstImage?.url || null;

    // 4. Periksa apakah Email atau WhatsApp sudah terdaftar di tabel Owner
    const existingEmail = await prisma.owner.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email ini sudah terdaftar sebagai Mitra Kos." },
        { status: 400 }
      );
    }

    const existingWa = await prisma.owner.findUnique({
      where: { whatsapp_number: cleanWa },
    });
    if (existingWa) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor WhatsApp ini sudah terdaftar. Silakan gunakan nomor lain atau hubungi admin.",
        },
        { status: 400 }
      );
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Simpan data Owner, Properti, dan PropertyMedia dalam transaksi
    const latNum = latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null;
    const lngNum = longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null;

    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.owner.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          whatsapp_number: cleanWa,
        },
      });

      const property = await tx.property.create({
        data: {
          name: propertyName.trim(),
          address: address.trim(),
          latitude: !isNaN(Number(latNum)) ? latNum : null,
          longitude: !isNaN(Number(lngNum)) ? lngNum : null,
          gender_type: cleanGender,
          price_per_month: priceNum,
          available_rooms: roomsNum,
          facilities: typeof facilities === "string" ? facilities.trim() : Array.isArray(facilities) ? (facilities as string[]).join(", ") : "Kasur, Lemari, WiFi",
          rules: typeof rules === "string" && rules.trim() ? rules.trim() : "Tertib dan menjaga kebersihan",
          image_url: mainThumbnailUrl,
          is_pet_friendly: Boolean(is_pet_friendly),
          is_24_hours: Boolean(is_24_hours),
          owner_id: owner.id,
        },
      });

      if (uploadedMediaList.length > 0) {
        await tx.propertyMedia.createMany({
          data: uploadedMediaList.map((m) => ({
            property_id: property.id,
            url: m.url,
            type: m.type,
          })),
        });
      }

      return { owner, property };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran mitra dan properti berhasil dibuat. Silakan masuk ke akun Anda.",
        data: {
          ownerId: result.owner.id,
          propertyId: result.property.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal melakukan pendaftaran mitra:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server saat memproses pendaftaran. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
