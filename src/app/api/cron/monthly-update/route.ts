import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

async function executeMonthlyUpdateRoutine(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, check authorization header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid CRON secret token",
        },
        { status: 401 }
      );
    }

    // Fetch all owners who have properties registered
    const owners = await prisma.owner.findMany({
      where: {
        properties: {
          some: {},
        },
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            available_rooms: true,
          },
        },
      },
    });

    if (owners.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Tidak ada pemilik kos dengan properti aktif yang ditemukan.",
          sentCount: 0,
        },
        { status: 200 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const results: Array<{ ownerId: string; ownerName: string; phone: string; success: boolean }> = [];

    for (const owner of owners) {
      try {
        // Invalidate older unused ROOM_UPDATE tokens for this owner
        await prisma.magicLink.updateMany({
          where: {
            owner_id: owner.id,
            type: "ROOM_UPDATE",
            is_used: false,
          },
          data: {
            is_used: true,
          },
        });

        // Generate new token (expires in 7 days)
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.magicLink.create({
          data: {
            token,
            type: "ROOM_UPDATE",
            expires_at: expiresAt,
            owner_id: owner.id,
          },
        });

        const updateUrl = `${baseUrl}/update/${token}`;
        const propertyNames = owner.properties.map((p) => p.name).join(", ");

        const message = [
          `Halo Bapak/Ibu *${owner.name}*,`,
          ``,
          `Saatnya pengingat pembaruan ketersediaan kamar bulanan untuk properti kos Anda (*${propertyNames}*) di *KosPasti*! 🏡`,
          ``,
          `Yuk perbarui sisa kamar kosong Anda agar calon penyewa mendapatkan informasi akurat dan pesanan tidak tertunda.`,
          ``,
          `Silakan klik tautan di bawah untuk memperbarui ketersediaan kamar secara instan tanpa perlu login:`,
          `👉 ${updateUrl}`,
          ``,
          `_Tautan berlaku selama 7 hari ke depan._`,
          `Terima kasih atas kerja samanya bersama KosPasti! 🙏`,
        ].join("\n");

        const sendRes = await sendWhatsAppMessage({
          to: owner.whatsapp_number,
          message,
        });

        results.push({
          ownerId: owner.id,
          ownerName: owner.name,
          phone: owner.whatsapp_number,
          success: sendRes.success,
        });
      } catch (ownerErr) {
        console.error(`Gagal memproses pengingat bulanan untuk owner ${owner.id}:`, ownerErr);
        results.push({
          ownerId: owner.id,
          ownerName: owner.name,
          phone: owner.whatsapp_number,
          success: false,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Pengingat update kamar bulanan berhasil diproses untuk ${results.length} pemilik kos.`,
        sentCount: results.filter((r) => r.success).length,
        totalOwners: results.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error executing monthly update routine:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat menjalankan cron update",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return executeMonthlyUpdateRoutine(request);
}

export async function POST(request: Request) {
  return executeMonthlyUpdateRoutine(request);
}
