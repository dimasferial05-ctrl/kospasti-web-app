import { NextRequest, NextResponse } from "next/server";
import { resolveNotificationActor } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveNotificationActor(request.url);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        ...actor.whereFilter,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updated_count: result.count,
      message: "Semua notifikasi telah ditandai dibaca.",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menandai semua notifikasi dibaca." },
      { status: 500 }
    );
  }
}

