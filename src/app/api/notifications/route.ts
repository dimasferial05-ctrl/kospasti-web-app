import { NextRequest, NextResponse } from "next/server";
import { resolveNotificationActor } from "@/lib/notification-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveNotificationActor(request.url);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = Number.isNaN(limitParam)
      ? 15
      : Math.min(Math.max(limitParam, 1), 50);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const listFilter = unreadOnly
      ? { ...actor.whereFilter, is_read: false }
      : actor.whereFilter;

    const [unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: { ...actor.whereFilter, is_read: false },
      }),
      prisma.notification.findMany({
        where: listFilter,
        orderBy: { created_at: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          link: true,
          is_read: true,
          read_at: true,
          created_at: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      unread_count: unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memuat notifikasi." },
      { status: 500 }
    );
  }
}
