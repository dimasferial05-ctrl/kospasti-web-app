import React from "react";
import Link from "next/link";
import { Compass, Search, Home, HelpCircle } from "lucide-react";

export const metadata = {
  title: "404 - Halaman Tidak Ditemukan | KosPasti",
  description: "Halaman atau kamar kos yang kamu cari tidak dapat ditemukan.",
};

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-soft text-center">
        {/* Animated Compass Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-3">
          404 • Halaman Tidak Ditemukan
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Kamar atau Halaman Tidak Ditemukan
        </h1>

        <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Kamar kos yang kamu cari mungkin sudah tidak tersedia, tautan telah kedaluwarsa, atau terdapat kesalahan pengetikan alamat URL.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/kos"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Cari Kos Lainnya</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <span>Butuh panduan?</span>
          <Link
            href="/bantuan"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pusat Bantuan KosPasti</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
