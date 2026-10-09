"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { GradientWave } from "@/components/ui/gradient-wave";

function PartnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccessMsg("Pendaftaran mitra berhasil! Silakan masuk dengan email dan kata sandi Anda.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Gagal melakukan login. Silakan periksa kembali email & password Anda.");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/partner/dashboard";
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan atau server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-soft border border-slate-200/60 dark:border-slate-800">
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-3">
          <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Email Mitra
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-soft hover:shadow-float hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Dashboard Mitra</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Belum memiliki akun Mitra?{" "}
          <Link href="/partner/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-[11px]">
          Bukan pemilik kos?{" "}
          <Link href="/login" className="text-slate-600 dark:text-slate-400 font-semibold hover:underline">
            Masuk sebagai Pencari Kos
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animated Gradient Wave */}
      <GradientWave
        colors={["#ecfdf5", "#a7f3d0", "#34d399", "#ffffff", "#6ee7b7", "#ffffff"]}
        noiseSpeed={0.000003}
        className="opacity-40 -z-10 pointer-events-none"
      />
      <div className="max-w-md mx-auto w-full relative z-10">
        {/* Back to Home Action */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-3.5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/logo.jpg"
              alt="KosPasti Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover shadow-soft group-hover:rotate-3 transition-transform block dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="KosPasti Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover shadow-soft group-hover:rotate-3 transition-transform hidden dark:block"
            />
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              KosPasti <span className="text-emerald-600 dark:text-emerald-400 font-bold">Portal Mitra</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Masuk ke Portal Mitra Kos
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Kelola data properti, ketersediaan kamar, dan konfirmasi pesanan sewa secara real-time.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat form login...</div>}>
          <PartnerLoginForm />
        </Suspense>

        {/* Support Help */}
        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Mengalami kendala masuk?{" "}
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20KosPasti,%20saya%20mengalami%20kendala%20login%20mitra."
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Bantuan WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
