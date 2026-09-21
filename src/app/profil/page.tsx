"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User as UserIcon,
  History,
  LogOut,
  Camera,
  Mail,
  Phone,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  ArrowRight,
  ArrowLeft,
  Home,
  ExternalLink,
  Edit3,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  bio: string | null;
  avatar: string | null;
  created_at: string;
}

interface BookingProperty {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url: string | null;
  address: string | null;
}

interface BookingItem {
  id: string;
  student_name: string;
  student_whatsapp: string;
  move_in_date: string;
  status: string;
  created_at: string;
  property: BookingProperty;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryTab = searchParams.get("tab") === "bookings" ? "bookings" : "profile";
  const [manualTab, setManualTab] = useState<"profile" | "bookings" | null>(null);
  const activeTab = manualTab ?? queryTab;
  const setActiveTab = (tab: "profile" | "bookings") => setManualTab(tab);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  // Logout State
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Fetch User Profile
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (isMounted && data.success && data.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setWhatsapp(data.user.whatsapp || "");
          setBio(data.user.bio || "");
          setAvatarPreview(data.user.avatar || null);
        }
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Cancel Editing & Revert Form
  const handleCancelEdit = () => {
    setName(user?.name || "");
    setWhatsapp(user?.whatsapp || "");
    setBio(user?.bio || "");
    setAvatarPreview(user?.avatar || null);
    setAvatarFile(null);
    setSaveErrorMessage(null);
    setIsEditing(false);
  };

  // 2. Fetch Bookings when Bookings Tab is active
  useEffect(() => {
    let isMounted = true;

    async function fetchBookings() {
      if (bookingsLoaded) return;
      try {
        setIsLoadingBookings(true);
        const res = await fetch("/api/user/bookings");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          setBookingsLoaded(true);
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat pesanan:", error);
      } finally {
        if (isMounted) {
          setIsLoadingBookings(false);
        }
      }
    }

    if (activeTab === "bookings") {
      fetchBookings();
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, bookingsLoaded, router]);

  // Handle Avatar Selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveErrorMessage("Ukuran file foto maksimal 2MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setSaveErrorMessage("Format file harus JPG, PNG, atau WebP.");
      return;
    }

    setSaveErrorMessage(null);
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedWhatsapp = whatsapp.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName) {
      setSaveErrorMessage("Nama lengkap wajib diisi.");
      return;
    }

    if (!trimmedWhatsapp) {
      setSaveErrorMessage("Nomor WhatsApp wajib diisi.");
      return;
    }

    if (trimmedWhatsapp.length > 15) {
      setSaveErrorMessage("Nomor WhatsApp tidak boleh melebihi 15 karakter.");
      return;
    }

    const waRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;
    if (!waRegex.test(trimmedWhatsapp)) {
      setSaveErrorMessage("Format nomor WhatsApp tidak valid. Gunakan format seperti 08123456789 atau +628123456789.");
      return;
    }

    if (trimmedBio.length > 150) {
      setSaveErrorMessage("Bio singkat maksimal 150 karakter.");
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("whatsapp", trimmedWhatsapp);
      formData.append("bio", trimmedBio);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSaveErrorMessage(data.error || "Gagal memperbarui profil.");
        return;
      }

      setUser(data.user);
      setName(data.user.name || "");
      setWhatsapp(data.user.whatsapp || "");
      setBio(data.user.bio || "");
      setAvatarPreview(data.user.avatar || null);
      setAvatarFile(null);
      setIsEditing(false);
      setSaveSuccessMessage("Profil berhasil disimpan dan diperbarui.");
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      setSaveErrorMessage("Terjadi kesalahan pada jaringan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const renderStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    if (upper === "PAID" || upper === "CONFIRMED" || upper === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Dikonfirmasi</span>
        </span>
      );
    }
    if (upper === "CANCELLED" || upper === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Dibatalkan</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Menunggu Pembayaran</span>
      </span>
    );
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Memuat profil pengguna...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Back Navigation Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-emerald-600 transition-all" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Header Title Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-emerald-500 flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={user?.name || "Foto Profil"}
                  fill
                  className="object-cover"
                  unoptimized={avatarPreview.startsWith("blob:")}
                />
              ) : (
                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {user?.name || "Pengguna KosPasti"}
              </h1>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {user?.bio && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 italic line-clamp-1 max-w-md">
                  &ldquo;{user.bio}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar Navigation + Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar Menu */}
          <aside className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Data Diri</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bookings")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "bookings"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Pesanan</span>
              </button>

              <hr className="my-1 border-slate-100 hidden lg:block" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{isLoggingOut ? "Keluar..." : "Keluar Akun"}</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {/* TAB 1: DATA DIRI */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Data Diri & Profil</h2>
                    <p className="text-sm text-slate-500">
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
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profil</span>
                    </button>
                  )}
                </div>

                {saveSuccessMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <span>{saveSuccessMessage}</span>
                  </div>
                )}

                {saveErrorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{saveErrorMessage}</span>
                  </div>
                )}

                {!isEditing ? (
                  /* VIEW MODE */
                  <div className="space-y-6">
                    <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-150">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center shrink-0">
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt={user?.name || "Foto Profil"}
                            fill
                            className="object-cover"
                            unoptimized={avatarPreview.startsWith("blob:")}
                          />
                        ) : (
                          <UserIcon className="w-9 h-9 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                          Foto Profil
                        </span>
                        <p className="text-sm font-medium text-slate-800">
                          {user?.avatar ? "Foto profil kustom terpasang" : "Menggunakan avatar bawaan"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Klik tombol &quot;Edit Profil&quot; di atas untuk mengganti foto.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-150 bg-white">
                        <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          Nama Lengkap
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{user?.name || "-"}</p>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-150 bg-white">
                        <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Nomor WhatsApp
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{user?.whatsapp || "-"}</p>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-150 bg-white md:col-span-2">
                        <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          Alamat Email
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{user?.email || "-"}</p>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-150 bg-white md:col-span-2">
                        <span className="text-xs font-medium text-slate-500 block mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Bio Singkat
                        </span>
                        {user?.bio ? (
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {user.bio}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">
                            Belum ada bio singkat. Klik &quot;Edit Profil&quot; untuk menambahkan deskripsi diri.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE FORM */
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Foto Profil Uploader */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Foto Profil
                      </label>
                      <div className="flex items-center gap-5">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="group relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer flex items-center justify-center transition-colors"
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
                            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Pilih Foto Baru
                          </button>
                          <p className="text-xs text-slate-500">
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

                    {/* Input Email (Read-Only) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
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
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed select-none"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Email akun tidak dapat diubah karena terhubung dengan autentikasi utama.
                      </p>
                    </div>

                    {/* Input Nama Lengkap */}
                    <div>
                      <label
                        htmlFor="user-name"
                        className="block text-sm font-semibold text-slate-800 mb-1.5"
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
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Input WhatsApp */}
                    <div>
                      <label
                        htmlFor="user-whatsapp"
                        className="block text-sm font-semibold text-slate-800 mb-1.5"
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
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Nomor ini digunakan oleh pemilik kos untuk mengonfirmasi pemesanan Anda.
                      </p>
                    </div>

                    {/* Textarea Bio Singkat */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="user-bio"
                          className="block text-sm font-semibold text-slate-800"
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
                          className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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
            )}

            {/* TAB 2: RIWAYAT PESANAN */}
            {activeTab === "bookings" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Riwayat Pemesanan Kos</h2>
                  <p className="text-sm text-slate-500">
                    Daftar semua permohonan dan transaksi sewa kos yang pernah Anda buat.
                  </p>
                </div>

                {isLoadingBookings ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
                    <p className="text-sm">Memuat riwayat pesanan...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Belum Ada Riwayat Pesanan</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                      Anda belum pernah mengajukan sewa kos. Temukan kos impian Anda sekarang!
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                    >
                      <span>Cari Kos Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            {booking.property?.image_url ? (
                              <Image
                                src={booking.property.image_url}
                                alt={booking.property.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Building className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-base">
                                {booking.property?.name || "Kos"}
                              </h3>
                              {booking.property?.gender_type && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {booking.property.gender_type}
                                </span>
                              )}
                            </div>

                            {booking.property?.address && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span>{booking.property.address}</span>
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Rencana Masuk: {formatDate(booking.move_in_date)}</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-400">
                              Dipesan pada: {formatDate(booking.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:items-end items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {renderStatusBadge(booking.status)}

                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Biaya Sewa</span>
                            <span className="text-sm sm:text-base font-bold text-emerald-700">
                              {formatRupiah(booking.property?.price_per_month || 0)}
                              <span className="text-xs font-normal text-slate-500">/bln</span>
                            </span>
                          </div>

                          {booking.property?.id && (
                            <Link
                              href={`/kos/${booking.property.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
                            >
                              <span>Lihat Kos</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">Memuat profil pengguna...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

