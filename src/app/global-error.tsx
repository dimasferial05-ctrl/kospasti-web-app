'use client';

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error("Fatal Global Error:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <html lang="id">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Sistem Mengalami Kendala Kritis
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Terjadi masalah mendasar pada aplikasi saat memuat tampilan utama. Silakan muat ulang halaman.
          </p>
          {error?.digest && (
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-6 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 inline-block">
              Kode Masalah: {error.digest}
            </p>
          )}
          <div>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
