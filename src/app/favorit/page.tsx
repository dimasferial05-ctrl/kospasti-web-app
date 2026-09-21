"use client";

import Link from "next/link";
import { Heart, Search, ArrowLeft, Sparkles } from "lucide-react";

export default function FavoritPage() {
  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-150 to-rose-50 border border-rose-200 flex items-center justify-center shadow-soft">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500/20 stroke-[1.8] animate-pulse" />
          <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>Segera Hadir</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kos Favorit Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Fitur penyimpanan kos favorit sedang dalam tahap persiapan. Nantinya Anda dapat menyimpan kos yang Anda sukai dan membandingkannya dengan mudah.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-soft transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Jelajahi Kos Sekarang</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
