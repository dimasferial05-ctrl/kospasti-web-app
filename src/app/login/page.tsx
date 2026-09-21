"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const errorParam = searchParams?.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>(() => {
    if (errorParam === "oauth_cancelled") {
      return { general: "Proses login dengan Google dibatalkan." };
    }
    if (errorParam === "oauth_exchange_failed" || errorParam === "oauth_profile_failed") {
      return { general: "Gagal menghubungkan akun Google. Silakan coba lagi." };
    }
    if (errorParam) {
      return { general: "Terjadi kesalahan saat login dengan Google." };
    }
    return {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Cek Kosong
    if (!email.trim()) {
      newErrors.email = "Alamat email wajib diisi.";
    } else {
      // 2. Cek Format Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Format alamat email tidak valid.";
      }
    }

    if (!password) {
      newErrors.password = "Password wajib diisi.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors({
          general: data?.error || "Email atau password salah.",
        });
        return;
      }

      setIsSuccess(true);

      // Arahkan ke halaman tujuan (callbackUrl atau beranda) setelah jeda singkat
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Login gagal:", err);
      setErrors({
        general: "Terjadi kesalahan koneksi saat login. Silakan periksa jaringan Anda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/60 relative overflow-hidden">
      {/* Ambient decorative background glow */}
      <div
        className="fixed top-12 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-12 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Main Glass/Card Container */}
      <div className="relative z-10 w-full max-w-md bg-white p-6 sm:p-9 rounded-2xl sm:rounded-3xl shadow-soft-lg border border-slate-200/80 transition-all">
        {/* State: Sukses */}
        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 shadow-soft">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Login Berhasil!
            </h2>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Selamat datang kembali. Anda akan diarahkan ke halaman utama dalam sekejap...
            </p>
          </div>
        ) : (
          <>
            {/* Header Form */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-3 border border-emerald-200/70 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Pencari Kos & Mahasiswa</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun Anda
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Silakan masukkan email dan password untuk melanjutkan.
              </p>
            </div>

            {/* General Error Banner */}
            {errors.general && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-start gap-2.5 text-left shadow-2xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* 1. Email Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={isLoading}
                    autoFocus
                    required
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      errors.email
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-rose-600 font-medium mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 2. Password Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      errors.password
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-rose-600 font-medium mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-soft hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </form>

            {/* Divider Atau */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold text-[10px] tracking-wider">
                  Atau masuk dengan
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <a
              href={`/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50/80 active:scale-[0.99] text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-slate-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Masuk dengan Google</span>
            </a>

            {/* Footer Register Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs sm:text-sm text-slate-600">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Daftar di sini
                </Link>
              </p>

              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

