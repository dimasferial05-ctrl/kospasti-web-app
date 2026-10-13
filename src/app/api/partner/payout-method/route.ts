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

    const payoutMethod = await prisma.payoutMethod.findUnique({
      where: { owner_id: payload.ownerId },
    });

    return NextResponse.json(
      {
        success: true,
        data: payoutMethod,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal mengambil metode payout mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

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

    const body = await request.json().catch(() => null);
    const bankName = typeof body?.bank_name === "string" ? body.bank_name.trim() : "";
    const accountNumber = typeof body?.account_number === "string" ? body.account_number.trim() : "";
    const accountHolder = typeof body?.account_holder === "string" ? body.account_holder.trim() : "";

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        {
          success: false,
          error: "Semua field rekening wajib diisi: nama bank/e-wallet, nomor rekening, dan nama pemilik rekening.",
        },
        { status: 400 }
      );
    }

    // Upsert PayoutMethod, reset status verifikasi ke false setiap kali ada perubahan rekening
    const payoutMethod = await prisma.payoutMethod.upsert({
      where: { owner_id: payload.ownerId },
      create: {
        owner_id: payload.ownerId,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        is_verified: false,
        verified_at: null,
      },
      update: {
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        is_verified: false,
        verified_at: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rekening pencairan dana berhasil disimpan. Rekening perlu diverifikasi ulang oleh tim admin sebelum pencairan dapat diproses.",
        data: payoutMethod,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal menyimpan metode payout mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat menyimpan rekening." },
      { status: 500 }
    );
  }
}
