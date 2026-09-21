"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

interface FormErrors {
  name?: string;
  whatsapp?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Cek Kosong
    if (!name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi.";
    }

    if (!whatsapp.trim()) {
      newErrors.whatsapp = "Nomor WhatsApp wajib diisi.";
    } else if (whatsapp.trim().length < 10) {
      newErrors.whatsapp = "Nomor WhatsApp tidak valid (minimal 10 digit).";
    }

    if (!email.trim()) {
      newErrors.email = "Alamat email wajib diisi.";
    } else {
      // 2. Cek Format Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Format alamat email tidak valid.";
      }
    }

    // 3. Cek Panjang Password
    if (!password) {
      newErrors.password = "Password wajib diisi.";
    } else if (password.length < 8) {
      newErrors.password = "Password minimal terdiri dari 8 karakter.";
    }

    // 4. Kecocokan Password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok.";
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

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          whatsapp: whatsapp.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors({
          general: data?.error || "Pendaftaran gagal. Silakan coba lagi.",
        });
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Registrasi gagal:", err);
      setErrors({
        general: "Terjadi kesalahan koneksi saat memproses pendaftaran. Silakan periksa jaringan Anda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/60 relative overflow-hidden">
      {/* Decorative ambient lighting elements */}
      <div
        className="fixed top-12 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-12 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md bg-white p-6 sm:p-9 rounded-2xl sm:rounded-3xl shadow-soft-lg border border-slate-200/80 transition-all my-6">
        {/* State: Sukses */}
        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 shadow-soft">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Akun Anda telah berhasil dibuat. Silakan masuk untuk mulai mencari dan memesan kamar kos idaman Anda.
            </p>

            <div className="pt-4">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-soft transition-all inline-block text-center"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header Form */}
            <div className="text-center mb-6">

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Daftar Akun Baru
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Lengkapi data di bawah untuk membuat akun pencari kos Anda.
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
              {/* 1. Nama Lengkap */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="register-name"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    disabled={isLoading}
                    autoFocus
                    required
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${errors.name
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p id="name-error" className="text-xs text-rose-600 font-medium mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 2. Nomor WhatsApp */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="register-whatsapp"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="register-whatsapp"
                    type="tel"
                    placeholder="0812xxxx..."
                    maxLength={13}
                    value={whatsapp}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, "");
                      setWhatsapp(numericValue);
                      if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                    }}
                    disabled={isLoading}
                    required
                    aria-invalid={!!errors.whatsapp}
                    aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${errors.whatsapp
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white"
                      }`}
                  />
                </div>
                {errors.whatsapp && (
                  <p id="whatsapp-error" className="text-xs text-rose-600 font-medium mt-1">
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              {/* 3. Email */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="register-email"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${errors.email
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

              {/* 4. Password */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="register-password"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${errors.password
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

              {/* 5. Konfirmasi Password */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password Anda"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50/80 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${errors.confirmPassword
                        ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="text-xs text-rose-600 font-medium mt-1">
                    {errors.confirmPassword}
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
                    <span>Mendaftar...</span>
                  </>
                ) : (
                  <span>Daftar Sekarang</span>
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
                  Atau daftar dengan
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <a
              href="/api/auth/google"
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
              <span>Daftar dengan Google</span>
            </a>

            {/* Footer Login Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs sm:text-sm text-slate-600">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Masuk di sini
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

