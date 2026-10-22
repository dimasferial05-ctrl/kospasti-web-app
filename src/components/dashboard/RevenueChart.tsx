"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { formatRupiah, MonthlyRevenueData } from "@/lib/revenue-helper";

interface RevenueChartProps {
  data: MonthlyRevenueData[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export function RevenueChart({
  data = [],
  title = "Tren Pendapatan Bulanan",
  subtitle = "Riwayat pergerakan omzet transaksi 6 bulan terakhir",
  badgeText = "Omzet Sewa",
}: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalPeriodRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookingsCount = data.reduce((sum, item) => sum + item.bookingsCount, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const isEmpty = totalPeriodRevenue === 0 && totalBookingsCount === 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft transition-all duration-200">
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              <TrendingUp className="w-3 h-3" />
              {badgeText}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Ringkasan Akumulasi */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Periode
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatRupiah(totalPeriodRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Batang */}
      {isEmpty ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5 text-slate-400 dark:text-slate-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Belum ada transaksi berhasil
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">
            Grafik analitik pendapatan akan muncul otomatis setelah terdapat transaksi sewa berstatus disetujui atau lunas.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          {/* Chart Canvas */}
          <div className="relative h-52 sm:h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 z-0">
              <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full flex justify-end">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 pr-1 -mt-2.5">
                  {formatRupiah(maxRevenue)}
                </span>
              </div>
              <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full flex justify-end">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 pr-1 -mt-2.5">
                  {formatRupiah(Math.round(maxRevenue / 2))}
                </span>
              </div>
              <div className="border-b border-slate-200 dark:border-slate-800 w-full flex justify-end">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 pr-1 -mt-2.5">
                  Rp 0
                </span>
              </div>
            </div>

            {/* Bars */}
            {data.map((item, index) => {
              const heightPercent =
                maxRevenue > 0 && item.revenue > 0
                  ? Math.max(10, Math.round((item.revenue / maxRevenue) * 100))
                  : 4;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={item.monthKey || index}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`Bulan ${item.month}: ${formatRupiah(item.revenue)}, ${item.bookingsCount} pesanan`}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative z-10 flex-1 flex flex-col items-center h-full justify-end group cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  {/* Tooltip Mengambang */}
                  {isHovered && (
                    <div className="absolute -top-14 z-30 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150 pointer-events-none whitespace-nowrap">
                      <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl py-1.5 px-3 shadow-float border border-slate-700/60 flex flex-col items-center">
                        <span className="text-[10px] font-medium text-slate-400">
                          {item.month} • {item.bookingsCount} booking
                        </span>
                        <span className="font-extrabold text-emerald-400 text-xs">
                          {formatRupiah(item.revenue)}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1 border-r border-b border-slate-700/60" />
                    </div>
                  )}

                  {/* Batang Diagram */}
                  <div className="w-full max-w-[42px] flex items-end justify-center h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        item.revenue > 0
                          ? isHovered
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20 scale-[1.03]"
                            : "bg-gradient-to-t from-emerald-600/90 to-teal-500/90 dark:from-emerald-500 dark:to-teal-400 hover:brightness-105"
                          : "bg-slate-100 dark:bg-slate-800/80 rounded-sm"
                      }`}
                    />
                  </div>

                  {/* Label Sumbu X (Bulan) */}
                  <span
                    className={`mt-3 text-[11px] font-bold tracking-tight transition-colors truncate max-w-[55px] ${
                      isHovered
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Diperbarui secara real-time berdasarkan data transaksi
            </span>
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {totalBookingsCount} Total Booking
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
