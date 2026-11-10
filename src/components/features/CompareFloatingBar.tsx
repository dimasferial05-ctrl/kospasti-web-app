"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X, ArrowRight, Trash2 } from "lucide-react";
import { useCompare, MAX_COMPARE_ITEMS } from "@/hooks/useCompare";

export function CompareFloatingBar() {
  const pathname = usePathname();
  const { compareList, count, removeFromCompare, clearCompare, isLoaded } = useCompare();

  // Jangan tampilkan jika belum loaded di client, tidak ada item terpilih, atau sedang di halaman /compare
  if (!isLoaded || count === 0 || pathname === "/compare") {
    return null;
  }

  const compareUrl = `/compare?ids=${compareList.map((item) => item.id).join(",")}`;

  return (
    <div
      data-testid="compare-floating-bar"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl px-2 sm:px-0 animate-slideUp pointer-events-none"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-float p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-auto">
        {/* Info Kos Terpilih */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {/* Thumbnail items */}
            <div className="flex items-center -space-x-2">
              {compareList.map((item) => (
                <div
                  key={item.id}
                  className="relative group w-8 h-8 rounded-lg overflow-hidden border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-2xs shrink-0"
                  title={item.name}
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {item.name.charAt(0)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromCompare(item.id);
                    }}
                    aria-label={`Hapus ${item.name} dari perbandingan`}
                    className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="min-w-0 pl-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Bandingkan Kos
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-1.5 py-0.2 rounded-full">
                  {count}/{MAX_COMPARE_ITEMS}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {count < 2 ? "Pilih minimal 1 kos lagi" : `${count} kos siap dibandingkan`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={clearCompare}
            title="Kosongkan daftar pilihan komparasi"
            aria-label="Kosongkan daftar komparasi"
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <Link
            href={compareUrl}
            className={`px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all duration-200 shadow-soft cursor-pointer active:scale-95 ${
              count >= 2
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-float"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            <span>{count >= 2 ? "Bandingkan Sekarang" : "Buka Komparasi"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CompareFloatingBar;
