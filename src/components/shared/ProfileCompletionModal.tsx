"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Phone, ShieldCheck, AlertCircle, Loader2, CheckCircle2, User as UserIcon } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
}

export function ProfileCompletionModal() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const checkUserSession = useCallback(async () => {
    // Jangan tampilkan modal di rute admin atau saat di halaman login / register
    if (
      pathname?.startsWith("/admin") ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.authenticated && data.user) {
        const user: UserProfile = data.user;
        setCurrentUser(user);
        setName(user.name || "");

        // Periksa apakah nomor WhatsApp belum terisi
        if (!user.whatsapp || user.whatsapp.trim() === "") {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Gagal memeriksa status profil pengguna:", err);
    }
  }, [pathname]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  // Listener jika terjadi custom event update profil dari komponen lain
  useEffect(() => {
    const handleProfileUpdate = () => {
      checkUserSession();
    };

    window.addEventListener("user_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileUpdate);
    };
  }, [checkUserSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanWa = whatsapp.trim();

    if (!cleanWa) {
      setErrorMessage("Nomor WhatsApp wajib diisi.");
      return;
    }

    if (cleanWa.length > 15) {
      setErrorMessage("Panjang nomor WhatsApp tidak boleh melebihi 15 karakter.");
      return;
    }

    const waRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;
    if (!waRegex.test(cleanWa)) {
      setErrorMessage(
        "Format nomor WhatsApp tidak valid. Gunakan format contoh: 08123456789 atau +628123456789."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp: cleanWa,
          name: name.trim() || undefined,
        }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error || "Gagal menyimpan data diri. Silakan coba lagi.");
      }

      setIsSuccess(true);

      // Beri jeda sejenak untuk menampilkan status sukses sebelum menutup modal
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        window.dispatchEvent(new Event("user_profile_updated"));
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-150 overflow-hidden">
        {/* Header Visual */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 pb-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Lengkapi Data Diri Anda
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Satu langkah lagi sebelum melanjutkan. Masukkan nomor WhatsApp aktif Anda untuk keperluan konfirmasi dan pemesanan kos.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Data diri berhasil disimpan. Memperbarui sesi...</span>
            </div>
          )}

          {/* Info Akun Login */}
          {currentUser && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
              <div className="text-slate-500 font-medium flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Akun Terhubung:</span>
              </div>
              <p className="font-semibold text-slate-850 truncate">{currentUser.name}</p>
              <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
            </div>
          )}

          {/* Input Nama Lengkap (Opsional untuk disesuaikan) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Input WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                autoFocus
                maxLength={15}
                value={whatsapp}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^\d+]/g, "").slice(0, 15);
                  setWhatsapp(cleaned);
                }}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gunakan format standar Indonesia (diawali 08 atau +628).
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan & Lanjutkan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileCompletionModal;
