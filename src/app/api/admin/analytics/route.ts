import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getBookingAmount,
  aggregateMonthlyRevenue,
  calculateRevenueGrowth,
  VALID_REVENUE_STATUSES,
} from "@/lib/revenue-helper";

export async function GET(request: NextRequest) {
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

    const bookings = await prisma.booking.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
            owner: {
              select: {
                name: true,
                whatsapp_number: true,
              },
            },
          },
        },
        room_type: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    let totalGtv = 0;
    let thisMonthGtv = 0;
    let lastMonthGtv = 0;
    let successfulBookingsCount = 0;

    const propertyRevenueMap = new Map<
      string,
      { id: string; name: string; ownerName: string; revenue: number; bookingsCount: number }
    >();

    for (const b of bookings) {
      const isSuccess = VALID_REVENUE_STATUSES.includes(b.status);
      if (!isSuccess) continue;

      const amount = getBookingAmount(b);
      totalGtv += amount;
      successfulBookingsCount += 1;

      const bDate = new Date(b.created_at);

      if (bDate >= startOfThisMonth) {
        thisMonthGtv += amount;
      } else if (bDate >= startOfLastMonth && bDate <= endOfLastMonth) {
        lastMonthGtv += amount;
      }

      if (b.property) {
        const propId = b.property.id;
        const existing = propertyRevenueMap.get(propId) || {
          id: propId,
          name: b.property.name,
          ownerName: b.property.owner?.name || "-",
          revenue: 0,
          bookingsCount: 0,
        };
        existing.revenue += amount;
        existing.bookingsCount += 1;
        propertyRevenueMap.set(propId, existing);
      }
    }

    const gtvGrowth = calculateRevenueGrowth(thisMonthGtv, lastMonthGtv);
    const averageOrderValue =
      successfulBookingsCount > 0 ? Math.round(totalGtv / successfulBookingsCount) : 0;

    const monthlyTrend = aggregateMonthlyRevenue(bookings, 6);

    const topProperties = Array.from(propertyRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalGtv,
        thisMonthGtv,
        lastMonthGtv,
        gtvGrowth,
        averageOrderValue,
        successfulBookingsCount,
        monthlyTrend,
        topProperties,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal server";
    console.error("Gagal mengambil data analitik platform admin:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
