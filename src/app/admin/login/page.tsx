"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Silakan masukkan email admin.");
      return;
    }

    if (!password) {
      setError("Silakan masukkan password admin.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Email atau password salah. Akses ditolak.");
      }
    } catch (err) {
      console.error("Login admin error:", err);
      setError("Terjadi kesalahan koneksi saat login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
      {/* Ambient decorative glow spheres */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/80 transition-all">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 mx-auto mb-4 border border-white/20">
            <ShieldCheck className="w-7 h-7 text-blue-300" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Login Admin KosPasti
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Masuk dengan akun terdaftar untuk mengelola dasbor properti kos.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Email Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="admin-email"
                type="email"
                placeholder="nama@kospasti.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoFocus
                required
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? "admin-login-error" : undefined}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                aria-invalid={!!error}
                aria-describedby={error ? "admin-login-error" : undefined}
                className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              id="admin-login-error"
              role="alert"
              aria-live="polite"
              className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <span>Masuk ke Dasbor Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Link */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
