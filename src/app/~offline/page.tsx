"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflineFallbackPage() {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    document.title = "Koneksi Terputus - KosPasti";
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mx-auto mb-5 text-rose-500 dark:text-rose-400 shadow-2xs">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Koneksi Terputus
        </h1>

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Anda sedang berada di mode offline. Periksa koneksi Wi-Fi atau paket data seluler Anda, lalu coba muat ulang halaman.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-soft hover:shadow-float transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Memeriksa Koneksi..." : "Coba Hubungkan Kembali"}</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
