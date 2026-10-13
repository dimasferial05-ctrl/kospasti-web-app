import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Akses ditolak. Anda harus login sebagai admin." },
        { status: 401 }
      );
    }

    const { id } = await props.params;

    const existing = await prisma.payoutMethod.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Data rekening tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.payoutMethod.update({
      where: { id },
      data: {
        is_verified: true,
        verified_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Rekening ${updated.bank_name} - ${updated.account_number} atas nama ${updated.account_holder} berhasil diverifikasi.`,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal memverifikasi rekening mitra:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal pada server saat memverifikasi rekening." },
      { status: 500 }
    );
  }
}
