import { NextRequest, NextResponse } from "next/server";
import { resolveNotificationActor } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await resolveNotificationActor(request.url);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID notifikasi tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan notifikasi benar-benar milik aktor yang bersangkutan
    const result = await prisma.notification.updateMany({
      where: {
        id,
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
      updated: result.count > 0,
      message: "Notifikasi ditandai telah dibaca.",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status notifikasi." },
      { status: 500 }
    );
  }
}

