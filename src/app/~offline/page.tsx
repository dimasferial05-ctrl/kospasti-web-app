"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home, Heart, Receipt, ArrowRight } from "lucide-react";
import { getCachedWishlist, getCachedBookings } from "@/lib/offline-storage";

export default function OfflineFallbackPage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedWishlistCount, setCachedWishlistCount] = useState<number>(0);
  const [cachedBookingsCount, setCachedBookingsCount] = useState<number>(0);

  useEffect(() => {
    document.title = "Koneksi Terputus - KosPasti";
    const wishlist = getCachedWishlist();
    const bookings = getCachedBookings();
    if (wishlist?.items) {
      setCachedWishlistCount(wishlist.items.length);
    }
    if (bookings?.bookings) {
      setCachedBookingsCount(bookings.bookings.length);
    }
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mx-auto mb-5 text-rose-500 dark:text-rose-400 shadow-2xs">
          <WifiOff className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Koneksi Terputus
        </h1>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Anda sedang berada di mode offline. Anda tetap dapat mengakses kos favorit yang sudah disimpan dan bukti e-receipt booking Anda.
        </p>

        {/* Quick Offline Access Links */}
        <div className="mt-6 space-y-2.5 text-left">
          <Link
            href="/favorit"
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-500 shrink-0">
                <Heart className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Kos Favorit Tersimpan
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {cachedWishlistCount > 0
                    ? `${cachedWishlistCount} kos tersedia untuk dibaca offline`
                    : "Buka daftar wishlist tersimpan"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/profil?tab=bookings"
            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Receipt className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  E-Receipt &amp; Riwayat Sewa
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {cachedBookingsCount > 0
                    ? `${cachedBookingsCount} pesanan siap dilihat offline`
                    : "Buka bukti booking Anda"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-soft hover:shadow-float transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isRetrying ? "Memeriksa Koneksi..." : "Coba Hubungkan Kembali"}</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
