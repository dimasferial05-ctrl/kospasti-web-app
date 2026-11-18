"use client";

import React from "react";
import Image from "next/image";
import {
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Camera,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { UserProfile } from "@/types/profile";

export interface ProfileInfoTabProps {
  user: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  name: string;
  setName: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleCancelEdit: () => void;
  isSaving: boolean;
  saveSuccessMessage: string | null;
  saveErrorMessage: string | null;
  setSaveSuccessMessage: (val: string | null) => void;
  setSaveErrorMessage: (val: string | null) => void;
  themeMounted: boolean;
}

export function ProfileInfoTab({
  user,
  isEditing,
  setIsEditing,
  name,
  setName,
  whatsapp,
  setWhatsapp,
  bio,
  setBio,
  avatarPreview,
  fileInputRef,
  handleAvatarChange,
  handleSaveProfile,
  handleCancelEdit,
  isSaving,
  saveSuccessMessage,
  saveErrorMessage,
  setSaveSuccessMessage,
  setSaveErrorMessage,
  themeMounted,
}: ProfileInfoTabProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Diri & Profil</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEditing
              ? "Ubah data diri Anda pada formulir di bawah ini lalu klik Simpan Perubahan."
              : "Informasi akun dan data diri yang tersimpan di sistem KosPasti."}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setSaveSuccessMessage(null);
              setSaveErrorMessage(null);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profil</span>
          </button>
        )}
      </div>

      {saveSuccessMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {saveErrorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {!isEditing ? (
        /* VIEW MODE */
        <div className="space-y-6">
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={user?.name || "Foto Profil"}
                  fill
                  className="object-cover"
                  unoptimized={avatarPreview.startsWith("blob:")}
                />
              ) : (
                <UserIcon className="w-9 h-9 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Foto Profil
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {user?.avatar ? "Foto profil kustom terpasang" : "Menggunakan avatar bawaan"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik tombol &quot;Edit Profil&quot; di atas untuk mengganti foto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Nama Lengkap
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || "-"}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Nomor WhatsApp
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.whatsapp || "-"}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Alamat Email
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Terhubung Google SSO</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email || "-"}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 md:col-span-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Bio Singkat
              </span>
              {user?.bio ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {user.bio}
                </p>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  Belum ada bio singkat. Klik &quot;Edit Profil&quot; untuk menambahkan deskripsi diri.
                </p>
              )}
            </div>
          </div>

          {/* Seksi Tampilan Aplikasi (Pengaturan Akun) */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  {themeMounted && (theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4 text-amber-500" /> : <Monitor className="w-4 h-4" />)}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Tampilan Aplikasi
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih tema visual antarmuka yang nyaman untuk mata Anda
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 capitalize">
                {themeMounted ? (theme === "dark" ? "Mode Gelap" : theme === "light" ? "Mode Terang" : "Sistem") : "Sistem"}
              </span>
            </div>

            {/* Interactive Radio Button Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                {
                  id: "light",
                  title: "Mode Terang",
                  desc: "Warna latar cerah bersih",
                  icon: Sun,
                  iconColor: "text-amber-500",
                },
                {
                  id: "dark",
                  title: "Mode Gelap",
                  desc: "Nyaman di kondisi minim cahaya",
                  icon: Moon,
                  iconColor: "text-emerald-400",
                },
                {
                  id: "system",
                  title: "Ikuti Sistem",
                  desc: "Otomatis sinkron dengan perangkat",
                  icon: Monitor,
                  iconColor: "text-slate-500 dark:text-slate-400",
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = themeMounted && theme === item.id;
                return (
                  <label
                    key={item.id}
                    onClick={() => {
                      if (item.id === "light") setTheme("light");
                      else if (item.id === "dark") setTheme("dark");
                      else setTheme("system");
                    }}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                        : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="mt-0.5 flex items-center justify-center">
                      <input
                        type="radio"
                        name="theme-selection"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => {
                          if (item.id === "light") setTheme("light");
                          else if (item.id === "dark") setTheme("dark");
                          else setTheme("system");
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-slate-300 dark:border-slate-600 bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${item.iconColor} shrink-0`} />
                        <span
                          className={`text-xs font-bold leading-none ${
                            isSelected
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM */
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Foto Profil
            </label>
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 cursor-pointer flex items-center justify-center transition-colors"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Preview Avatar"
                    fill
                    className="object-cover group-hover:opacity-75 transition-opacity"
                    unoptimized={avatarPreview.startsWith("blob:")}
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <Camera className="w-6 h-6 mb-0.5" />
                  <span className="text-[10px] font-medium">Ubah</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  Pilih Foto Baru
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format JPG, PNG, atau WebP. Maksimal 2MB.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                disabled
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Email akun tidak dapat diubah karena terhubung dengan autentikasi utama.
            </p>
          </div>

          <div>
            <label
              htmlFor="user-name"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="user-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Pratama"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="user-whatsapp"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Nomor WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="user-whatsapp"
                type="tel"
                required
                maxLength={15}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 08123456789 atau +628123456789"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Nomor ini digunakan oleh pemilik kos untuk mengonfirmasi pemesanan Anda.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="user-bio"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Bio Singkat
              </label>
              <span
                className={`text-xs ${
                  bio.length > 150 ? "text-rose-600 font-semibold" : "text-slate-400"
                }`}
              >
                {bio.length}/150
              </span>
            </div>
            <div className="relative">
              <textarea
                id="user-bio"
                rows={3}
                maxLength={150}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan sedikit tentang diri Anda, kampus/pekerjaan, dsb..."
                className="w-full p-3.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
