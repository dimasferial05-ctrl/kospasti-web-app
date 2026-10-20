"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Building2, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const errorParam = searchParams?.get("error");

  const getErrorMessage = (error: string | null) => {
    if (!error) return null;
    if (error === "oauth_cancelled") {
      return "Proses masuk dengan Google dibatalkan.";
    }
    if (error === "oauth_exchange_failed" || error === "oauth_profile_failed") {
      return "Gagal menghubungkan akun Google. Silakan coba beberapa saat lagi.";
    }
    if (error === "missing_code") {
      return "Kode otorisasi Google tidak ditemukan. Silakan coba lagi.";
    }
    if (error === "server_configuration") {
      return "Konfigurasi Google OAuth server belum lengkap. Silakan hubungi admin.";
    }
    return "Terjadi kesalahan saat masuk dengan Google. Silakan coba lagi.";
  };

  const errorMessage = getErrorMessage(errorParam);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-soft-lg border border-slate-200/80 dark:border-slate-800 text-center">
        {/* Brand Logo KosPasti */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.jpg"
            alt="KosPasti Logo"
            width={52}
            height={52}
            priority
            className="w-[52px] h-[52px] rounded-2xl object-cover shadow-soft border border-slate-200/80 dark:border-slate-800 block dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="KosPasti Logo"
            width={52}
            height={52}
            priority
            className="w-[52px] h-[52px] rounded-2xl object-cover shadow-soft border border-slate-200/80 dark:border-slate-800 hidden dark:block"
          />
        </div>

        {/* Header Title */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Masuk ke KosPasti
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Gunakan akun Google Anda untuk mengakses pencarian dan booking kos.
        </p>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-start gap-2.5 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google SSO Button */}
        <div className="mt-6">
          <a
            href={`/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-[0.98] text-slate-700 dark:text-slate-100 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-soft transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Lanjutkan dengan Google</span>
          </a>
        </div>

        {/* Disclaimer Terms */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4 leading-relaxed">
          Dengan melanjutkan, Anda menyetujui{" "}
          <Link
            href="/bantuan"
            className="text-slate-600 dark:text-slate-300 font-medium underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Ketentuan Layanan
          </Link>{" "}
          serta{" "}
          <Link
            href="/bantuan"
            className="text-slate-600 dark:text-slate-300 font-medium underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Kebijakan Privasi
          </Link>{" "}
          KosPasti.
        </p>

        {/* Footer Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-2.5">
          <Link
            href="/partner/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Pemilik Kos? Masuk ke Portal Mitra</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
