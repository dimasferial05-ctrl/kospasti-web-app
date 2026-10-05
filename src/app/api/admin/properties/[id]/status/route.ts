import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Placeholder fungsi untuk notifikasi WhatsApp ke pemilik kos
 * (TODO: Aktifkan kembali integrasi Foonte saat token siap digunakan)
 */
async function sendWhatsAppStatusNotification(
  ownerPhone: string,
  ownerName: string,
  propertyName: string,
  status: "PUBLISHED" | "REJECTED",
  rejectionReason?: string | null
) {
  // TODO: Integrasikan dengan layanan WhatsApp (Foonte)
  // Contoh payload:
  // if (status === "PUBLISHED") {
  //   pesan = `Halo ${ownerName}, kabar baik! Properti kos Anda "${propertyName}" telah disetujui oleh Admin KosPasti dan sudah tayang di pencarian publik.`;
  // } else {
  //   pesan = `Halo ${ownerName}, mohon maaf properti kos "${propertyName}" belum dapat disetujui oleh Admin KosPasti. Alasan: ${rejectionReason}. Silakan perbaiki data melalui dashboard mitra.`;
  // }
  console.log(`[WHATSAPP NOTIFICATION STUB] To: ${ownerPhone} (${ownerName}), Property: ${propertyName}, Status: ${status}, Reason: ${rejectionReason || "-"}`);
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Token autentikasi admin tidak valid.",
        },
        { status: 401 }
      );
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID properti wajib disertakan." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, rejectionReason } = body;

    const validStatuses = ["PUBLISHED", "REJECTED", "PENDING_REVIEW"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status tidak valid. Pilihan yang tersedia: ${validStatuses.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (status === "REJECTED") {
      if (!rejectionReason || typeof rejectionReason !== "string" || !rejectionReason.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Alasan penolakan wajib diisi ketika menolak properti kos.",
          },
          { status: 400 }
        );
      }
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Properti tidak ditemukan." },
        { status: 404 }
      );
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason.trim() : null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            whatsapp_number: true,
          },
        },
        media: true,
        room_types: {
          orderBy: {
            price_per_month: "asc",
          },
        },
      },
    });

    // Kirim notifikasi WA (Stub / TODO saat Foonte aktif)
    if (existingProperty.owner?.whatsapp_number && (status === "PUBLISHED" || status === "REJECTED")) {
      await sendWhatsAppStatusNotification(
        existingProperty.owner.whatsapp_number,
        existingProperty.owner.name,
        existingProperty.name,
        status as "PUBLISHED" | "REJECTED",
        status === "REJECTED" ? rejectionReason : null
      );
    }

    return NextResponse.json({
      success: true,
      message:
        status === "PUBLISHED"
          ? "Properti berhasil disetujui dan sekarang tayang secara publik."
          : status === "REJECTED"
          ? "Properti telah ditolak dan alasan penolakan telah dicatat."
          : "Status properti berhasil diubah.",
      data: updatedProperty,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    console.error("Gagal mengubah status persetujuan properti:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
