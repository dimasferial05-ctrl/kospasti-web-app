'use client';

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function RouteErrorBoundary({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Route Error:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft text-center">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Terjadi Kendala Teknis
        </h2>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Halaman ini sementara tidak dapat dimuat karena terjadi kesalahan tak terduga. Silakan coba muat ulang atau kembali ke beranda.
        </p>

        {error?.digest && (
          <div className="mb-6 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-mono text-slate-500 dark:text-slate-400">
            ID Insiden: <span className="select-all font-semibold">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
