import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  aggregateMonthlyRevenue,
  calculateRevenueGrowth,
  VALID_REVENUE_STATUSES,
} from "@/lib/revenue-helper";
import { isValidAdminRequest, createAdminUnauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    if (!isValidAdminRequest(request)) {
      return createAdminUnauthorizedResponse();
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const startOfSixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);

    const [totalAgg, thisMonthAgg, lastMonthAgg, recentBookings, topPropertiesGroup] =
      await Promise.all([
        // 1. Total omzet keseluruhan & total transaksi sukses
        prisma.booking.aggregate({
          where: { status: { in: VALID_REVENUE_STATUSES } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        // 2. Omzet bulan berjalan (This Month)
        prisma.booking.aggregate({
          where: {
            status: { in: VALID_REVENUE_STATUSES },
            created_at: { gte: startOfThisMonth },
          },
          _sum: { amount: true },
        }),
        // 3. Omzet bulan lalu (Last Month)
        prisma.booking.aggregate({
          where: {
            status: { in: VALID_REVENUE_STATUSES },
            created_at: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          _sum: { amount: true },
        }),
        // 4. Data transaksi hanya 6 bulan terakhir untuk grafik tren bulanan
        prisma.booking.findMany({
          where: {
            status: { in: VALID_REVENUE_STATUSES },
            created_at: { gte: startOfSixMonthsAgo },
          },
          select: {
            id: true,
            created_at: true,
            status: true,
            amount: true,
            property_id: true,
            room_type: {
              select: {
                id: true,
                name: true,
                price_per_month: true,
              },
            },
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
          },
          orderBy: { created_at: "asc" },
        }),
        // 5. Agregasi 5 properti dengan omzet tertinggi
        prisma.booking.groupBy({
          by: ["property_id"],
          where: { status: { in: VALID_REVENUE_STATUSES } },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: {
            _sum: { amount: "desc" },
          },
          take: 5,
        }),
      ]);

    const totalGtv = totalAgg._sum.amount || 0;
    const successfulBookingsCount = totalAgg._count._all || 0;
    const thisMonthGtv = thisMonthAgg._sum.amount || 0;
    const lastMonthGtv = lastMonthAgg._sum.amount || 0;

    const gtvGrowth = calculateRevenueGrowth(thisMonthGtv, lastMonthGtv);
    const averageOrderValue =
      successfulBookingsCount > 0 ? Math.round(totalGtv / successfulBookingsCount) : 0;

    const monthlyTrend = aggregateMonthlyRevenue(recentBookings, 6);

    const topPropertyIds = topPropertiesGroup
      .map((g) => g.property_id)
      .filter((id): id is string => Boolean(id));

    const propertyDetails =
      topPropertyIds.length > 0
        ? await prisma.property.findMany({
            where: { id: { in: topPropertyIds } },
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  name: true,
                },
              },
            },
          })
        : [];

    const propMap = new Map(propertyDetails.map((p) => [p.id, p]));

    const topProperties = topPropertiesGroup.map((g) => {
      const detail = propMap.get(g.property_id);
      return {
        id: g.property_id,
        name: detail?.name || "Kos",
        ownerName: detail?.owner?.name || "-",
        revenue: g._sum?.amount || 0,
        bookingsCount: g._count?._all || 0,
      };
    });

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
