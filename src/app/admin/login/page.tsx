"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Silakan masukkan PIN Admin.");
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
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "PIN salah. Akses ditolak.");
      }
    } catch (err) {
      console.error("Login admin error:", err);
      setError("Terjadi kesalahan koneksi saat login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-slate-800/10">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-800 shadow-inner">
          <Shield className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold mb-2 text-slate-800">Login Admin KosPasti</h1>
        <p className="text-xs text-slate-500 mb-6">
          Masukkan PIN otoritas untuk mengakses Dasbor Manajemen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="Masukkan PIN Admin"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-center text-lg tracking-widest font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-800 transition-all bg-slate-50/50"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-left">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memverifikasi PIN...</span>
              </>
            ) : (
              <span>Masuk Ruang Tahta</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
