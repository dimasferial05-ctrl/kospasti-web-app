import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Payload pendaftaran tidak valid." },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      whatsapp_number,
      // Property data
      propertyName,
      address,
      latitude,
      longitude,
      gender_type,
      price_per_month,
      available_rooms,
      facilities,
      rules,
      image_url,
      is_pet_friendly,
      is_24_hours,
    } = body;

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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password harus minimal 8 karakter dan mengandung setidaknya 1 huruf besar, 1 huruf kecil, dan 1 angka.",
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

    // 3. Periksa apakah Email atau WhatsApp sudah terdaftar di tabel Owner
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

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Simpan data Owner dan Properti Perdana dalam transaksi
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
          facilities: typeof facilities === "string" ? facilities.trim() : Array.isArray(facilities) ? facilities.join(", ") : "Kasur, Lemari, WiFi",
          rules: rules?.trim?.() || "Tertib dan menjaga kebersihan",
          image_url: image_url?.trim?.() || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
          is_pet_friendly: Boolean(is_pet_friendly),
          is_24_hours: Boolean(is_24_hours),
          owner_id: owner.id,
        },
      });

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
