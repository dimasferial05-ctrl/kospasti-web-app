"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Edit2,
  Plus,
  ShieldAlert,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Check,
} from "lucide-react";

const BANK_OPTIONS = [
  "BCA",
  "BNI",
  "BRI",
  "Mandiri",
  "BSI",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "GoPay",
  "OVO",
  "Dana",
  "ShopeePay",
  "LinkAja",
  "Jenius",
  "SeaBank",
];

interface PayoutMethodData {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  verified_at: string | null;
  updated_at: string;
}

interface PartnerProfileData {
  id: string;
  name: string;
  email: string;
  whatsapp_number: string;
  avatar_url: string | null;
  total_properties?: number;
  created_at?: string;
}

export default function PartnerProfilePage() {
  const [partnerInfo, setPartnerInfo] = useState<PartnerProfileData | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profil Form States
  const [profileName, setProfileName] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Rekening Payout Form States
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [resProfile, resMethod] = await Promise.all([
          fetch("/api/partner/me"),
          fetch("/api/partner/payout-method"),
        ]);

        const dataProfile = await resProfile.json();
        const dataMethod = await resMethod.json();

        if (!ignore) {
          if (dataProfile.authenticated && dataProfile.owner) {
            setPartnerInfo(dataProfile.owner);
            setProfileName(dataProfile.owner.name || "");
            setProfileWhatsapp(dataProfile.owner.whatsapp_number || "");
            setAvatarPreview(dataProfile.owner.avatar_url || null);
          }

          if (dataMethod.success && dataMethod.data) {
            setPayoutMethod(dataMethod.data);
            setBankName(dataMethod.data.bank_name);
            setAccountNumber(dataMethod.data.account_number);
            setAccountHolder(dataMethod.data.account_holder);
          } else {
            setPayoutMethod(null);
            if (dataProfile?.owner?.name) {
              setAccountHolder(dataProfile.owner.name);
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // Handle Pilih File Avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran file foto profil tidak boleh melebihi 2MB.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      showToast("error", "Format file harus berupa JPG, PNG, atau WebP.");
      return;
    }

    setAvatarFile(file);
    setIsRemovingAvatar(false);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Handle Hapus Foto Avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsRemovingAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Perubahan Profil
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileName.trim() || profileName.trim().length < 2) {
      showToast("error", "Nama pengelola kos minimal 2 karakter.");
      return;
    }

    const waClean = profileWhatsapp.trim();
    const waRegex = /^(?:\+62|62|0)8[0-9]{8,12}$/;
    if (!waClean || !waRegex.test(waClean)) {
      showToast("error", "Nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789).");
      return;
    }

    setIsSubmittingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", profileName.trim());
      formData.append("whatsapp_number", waClean);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (isRemovingAvatar) {
        formData.append("remove_avatar", "true");
      }

      const res = await fetch("/api/partner/profile", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      setPartnerInfo((prev) => ({
        ...prev!,
        ...data.data,
      }));
      setAvatarPreview(data.data.avatar_url || null);
      setAvatarFile(null);
      setIsRemovingAvatar(false);
      showToast("success", "Profil pengelola berhasil disimpan!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan profil.";
      showToast("error", message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Submit Ganti Password
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast("error", "Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch("/api/partner/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui kata sandi.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Kata sandi berhasil diperbarui!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengganti password.";
      showToast("error", message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Submit Rekening Payout
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber.trim() || !accountHolder.trim()) {
      showToast("error", "Semua data rekening wajib diisi.");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await fetch("/api/partner/payout-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan rekening.");
      }

      setPayoutMethod(data.data);
      setIsEditingPayout(false);
      showToast("success", "Rekening berhasil disimpan! Menunggu verifikasi admin.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan rekening.";
      showToast("error", message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-float border flex items-center gap-3 transition-all animate-in slide-in-from-bottom duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-200 border-emerald-700/60"
              : "bg-rose-950 text-rose-200 border-rose-700/60"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan Akun & Profil Mitra
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi nama pengelola, foto profil resmi, keamanan kata sandi, dan rekening pencairan sewa kos.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-bold text-slate-500">Memuat data akun mitra...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ======================================================== */}
          {/* KOLOM KIRI: EDIT PROFIL MITRA & FOTO AVATAR (7 Kolom)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Data Profil & Foto Pengelola
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Foto dan nama ini akan tampil di kartu &quot;Dikelola oleh&quot; dan balasan ulasan penghuni.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitProfile} className="space-y-6">
                {/* Bagian Unggah Foto Avatar */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shadow-soft">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Foto Profil Mitra"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300 select-none">
                          {profileName.trim() ? profileName.trim().charAt(0).toUpperCase() : "M"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-float transition-all active:scale-95 cursor-pointer"
                      title="Ganti Foto Profil"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Foto Profil / Logo Kos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Format JPG, PNG, atau WebP. Maksimal 2MB. Disarankan foto rasio 1:1 untuk hasil terbaik.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Pilih Foto
                      </button>
                      {(avatarPreview || avatarFile) && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Nama & WhatsApp */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Nama Lengkap / Pengelola Kos <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Contoh: Haji Sulaiman / Pengelola Kos Ibu Dewi"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={profileWhatsapp}
                        onChange={(e) => setProfileWhatsapp(e.target.value)}
                        placeholder="Contoh: 08123456789 atau 628123456789"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nomor ini akan dihubungi oleh calon mahasiswa untuk koordinasi check-in kos.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Email Terdaftar (Akun Login)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={partnerInfo?.email || "-"}
                        disabled
                        className="w-full pl-10 pr-24 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Terkunci
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-soft hover:shadow-float active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Simpan Perubahan Profil</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bagian Keamanan Kata Sandi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Keamanan & Kata Sandi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui kata sandi secara berkala untuk menjaga keamanan akun portal mitra Anda.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Kata Sandi Baru <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-soft active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Perbarui Kata Sandi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KOLOM KANAN: REKENING PENCAIRAN DANA PAYOUT (5 Kolom)     */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Rekening Pencairan Dana
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tujuan transfer hasil sewa setelah penyewa check-in.
                    </p>
                  </div>
                </div>

                {payoutMethod && !isEditingPayout && (
                  <button
                    onClick={() => setIsEditingPayout(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-center cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                )}
              </div>

              {/* Status Rekening */}
              {payoutMethod && !isEditingPayout ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Bank / E-Wallet
                      </span>
                      {payoutMethod.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu Verifikasi
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-wide">
                        {payoutMethod.account_number}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        {payoutMethod.bank_name} &bull; a.n. {payoutMethod.account_holder}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hasil sewa kos akan otomatis dicairkan ke rekening di atas setiap kali ada pemesanan yang selesai check-in.
                  </p>
                </div>
              ) : !payoutMethod && !isEditingPayout ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Belum Ada Rekening
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Daftarkan rekening bank atau e-wallet agar hasil sewa kamar dapat dicairkan.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingPayout(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-soft transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Rekening
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitPayout} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p>
                      Pastikan <strong>Nama Pemilik Rekening</strong> sama persis dengan nama di buku tabungan agar proses verifikasi admin lancar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Pilihan Bank / E-Wallet <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Nomor Rekening / No. HP E-Wallet <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                      Nama Pemilik Rekening <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Nama di buku tabungan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    {payoutMethod && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPayout(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingPayout}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-soft active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingPayout ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Rekening</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
