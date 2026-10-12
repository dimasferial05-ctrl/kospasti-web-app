import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getBookingAmount,
  aggregateMonthlyRevenue,
  calculateRevenueGrowth,
  VALID_REVENUE_STATUSES,
} from "@/lib/revenue-helper";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const partnerToken = cookieStore.get("partner_token")?.value;

    if (!partnerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Token mitra tidak ditemukan" },
        { status: 401 }
      );
    }

    const payload = await verifyOwnerToken(partnerToken);
    if (!payload || !payload.ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sesi mitra tidak valid" },
        { status: 401 }
      );
    }

    const ownerId = payload.ownerId;

    // Ambil properti milik owner
    const properties = await prisma.property.findMany({
      where: { owner_id: ownerId },
      select: {
        id: true,
        name: true,
        price_per_month: true,
      },
    });

    const propertyIds = properties.map((p) => p.id);

    // Ambil semua booking untuk kos milik owner beserta detail kamar dan properti
    const bookings = await prisma.booking.findMany({
      where: {
        property_id: { in: propertyIds },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            price_per_month: true,
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

    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let successfulBookingsCount = 0;

    const propertyRevenueMap = new Map<string, { id: string; name: string; revenue: number; bookingsCount: number }>();

    for (const p of properties) {
      propertyRevenueMap.set(p.id, { id: p.id, name: p.name, revenue: 0, bookingsCount: 0 });
    }

    for (const b of bookings) {
      const isSuccess = VALID_REVENUE_STATUSES.includes(b.status);
      if (!isSuccess) continue;

      const amount = getBookingAmount(b);
      totalRevenue += amount;
      successfulBookingsCount += 1;

      const bDate = new Date(b.created_at);

      if (bDate >= startOfThisMonth) {
        thisMonthRevenue += amount;
      } else if (bDate >= startOfLastMonth && bDate <= endOfLastMonth) {
        lastMonthRevenue += amount;
      }

      const propData = propertyRevenueMap.get(b.property_id);
      if (propData) {
        propData.revenue += amount;
        propData.bookingsCount += 1;
      }
    }

    const revenueGrowth = calculateRevenueGrowth(thisMonthRevenue, lastMonthRevenue);
    const averageOrderValue =
      successfulBookingsCount > 0 ? Math.round(totalRevenue / successfulBookingsCount) : 0;

    const monthlyTrend = aggregateMonthlyRevenue(bookings, 6);

    const topProperties = Array.from(propertyRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        averageOrderValue,
        successfulBookingsCount,
        monthlyTrend,
        topProperties,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data analitik mitra:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data analitik finansial mitra." },
      { status: 500 }
    );
  }
}
