"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { UserProfile } from "@/types/profile";

interface SecurityTabProps {
  user: UserProfile | null;
  onPasswordUpdated?: () => void;
}

export function SecurityTab({ user, onPasswordUpdated }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("Kata sandi baru minimal harus 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    if (user?.hasPassword && !currentPassword) {
      setErrorMessage("Kata sandi saat ini wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/user/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: user?.hasPassword ? currentPassword : undefined,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setErrorMessage(data?.error || "Gagal memperbarui kata sandi.");
        return;
      }

      setSuccessMessage(
        data.message || "Kata sandi akun Anda berhasil diperbarui."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onPasswordUpdated) {
        onPasswordUpdated();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan saat menyimpan kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kartu Status Keamanan Akun */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Status Autentikasi Akun
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola proteksi akun Anda dengan kata sandi dan integrasi Google SSO.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Integrasi Google
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{user?.isGoogleLinked ? "Terhubung" : "Tersedia"}</span>
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Proteksi Kata Sandi
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                user?.hasPassword
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{user?.hasPassword ? "Aktif" : "Belum Dibuat"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Formulir Ganti / Buat Password */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          {user?.hasPassword ? "Perbarui Kata Sandi" : "Buat Kata Sandi Akun"}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          {user?.hasPassword
            ? "Gunakan minimal 8 karakter kombinasi huruf dan angka untuk keamanan optimal."
            : "Buat kata sandi agar Anda juga dapat masuk menggunakan email dan password."}
        </p>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 max-w-md">
          {user?.hasPassword && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kata Sandi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
