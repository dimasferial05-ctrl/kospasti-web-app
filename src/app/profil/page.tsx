"use client";

import { useState, useEffect, useRef, Suspense, useSyncExternalStore } from "react";
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
  ExternalLink,
  Edit3,
  X,
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { HelpTooltip } from "@/components/ui/Tooltip";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  bio: string | null;
  avatar: string | null;
  created_at: string;
  hasPassword?: boolean;
  isGoogleLinked?: boolean;
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
  checkin_confirmed_at?: string | null;
  cancellation_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_holder?: string | null;
  refund_note?: string | null;
  refunded_at?: string | null;
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

  const { theme, setTheme } = useTheme();
  const themeMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelReasonCategory, setCancelReasonCategory] = useState("Perubahan rencana kuliah/studi");
  const [cancelCustomReason, setCancelCustomReason] = useState("");
  const [cancelBankName, setCancelBankName] = useState("BCA");
  const [cancelCustomBank, setCancelCustomBank] = useState("");
  const [cancelAccountNumber, setCancelAccountNumber] = useState("");
  const [cancelAccountHolder, setCancelAccountHolder] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Dispute Modal State
  const [disputeBooking, setDisputeBooking] = useState<BookingItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);

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
    if (upper === "ACCEPTED" || upper === "CONFIRMED" || upper === "APPROVED" || upper === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Disetujui</span>
          <HelpTooltip text="Pesanan telah disetujui pemilik kos. Anda dapat langsung berkomunikasi untuk persiapan check-in." />
        </span>
      );
    }
    if (upper === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Clock className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
          <span>Check-In Dikonfirmasi Mitra</span>
          <HelpTooltip text="Mitra mengonfirmasi Anda telah check-in. Terdapat masa tenggang 12 jam untuk melaporkan masalah jika ada kendala." />
        </span>
      );
    }
    if (upper === "DISPUTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>Dalam Sanggahan (Dispute)</span>
          <HelpTooltip text="Anda telah mengajukan sanggahan/masalah. Tim Admin KosPasti sedang menginvestigasi laporan Anda." />
        </span>
      );
    }
    if (upper === "PAYOUT_PENDING" || upper === "PAYOUT_PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Selesai</span>
          <HelpTooltip text="Check-in selesai dan masa sewa telah aktif." />
        </span>
      );
    }
    if (upper === "PAID") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Menunggu Konfirmasi Pemilik</span>
          <HelpTooltip text="DP Anda telah terverifikasi lunas. Pemilik kos sedang memeriksa ketersediaan kamar untuk menyetujui pesanan Anda." />
        </span>
      );
    }
    if (upper === "REFUND_REQUESTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Menunggu Pengembalian Dana</span>
          <HelpTooltip text="Pengajuan pembatalan telah diterima. Pemilik kos sedang memproses pengembalian dana ke rekening/e-wallet Anda." />
        </span>
      );
    }
    if (upper === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-sky-600" />
          <span>Dana Telah Dikembalikan</span>
          <HelpTooltip text="Pengembalian dana telah selesai ditransfer oleh pemilik kos." />
        </span>
      );
    }
    if (upper === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span>Dibatalkan</span>
          <HelpTooltip text="Pesanan ini telah dibatalkan." />
        </span>
      );
    }
    if (upper === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Ditolak Pemilik</span>
          <HelpTooltip text="Pesanan tidak dapat dipenuhi pemilik kos." />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Menunggu Pembayaran DP</span>
        <HelpTooltip text="Silakan selesaikan pembayaran DP Anda sesuai batas waktu invoice untuk mengunci kamar kos." />
      </span>
    );
  };

  const handleOpenCancelModal = (booking: BookingItem) => {
    setCancellingBooking(booking);
    setCancelReasonCategory("Perubahan rencana kuliah/studi");
    setCancelCustomReason("");
    setCancelBankName("BCA");
    setCancelCustomBank("");
    setCancelAccountNumber("");
    setCancelAccountHolder(user?.name || booking.student_name || "");
    setCancelError(null);
  };

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    const isPaidOrApproved = ["PAID", "APPROVED", "ACCEPTED"].includes(cancellingBooking.status?.toUpperCase());

    const finalReason =
      cancelReasonCategory === "Lainnya"
        ? cancelCustomReason.trim()
        : cancelCustomReason.trim()
        ? `${cancelReasonCategory} - ${cancelCustomReason.trim()}`
        : cancelReasonCategory;

    const finalBank = cancelBankName === "Lainnya" ? cancelCustomBank.trim() : cancelBankName;

    if (isPaidOrApproved) {
      if (!finalReason) {
        setCancelError("Alasan pembatalan wajib diisi.");
        return;
      }
      if (!finalBank) {
        setCancelError("Nama Bank atau E-Wallet tujuan pengembalian dana wajib diisi.");
        return;
      }
      if (!cancelAccountNumber.trim()) {
        setCancelError("Nomor rekening atau nomor akun e-wallet tujuan wajib diisi.");
        return;
      }
      if (!cancelAccountHolder.trim()) {
        setCancelError("Nama lengkap pemilik rekening tujuan wajib diisi.");
        return;
      }
    }

    try {
      setIsSubmittingCancel(true);
      setCancelError(null);

      const res = await fetch(`/api/user/bookings/${cancellingBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: finalReason,
          bankName: finalBank,
          accountNumber: cancelAccountNumber.trim(),
          accountHolder: cancelAccountHolder.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setCancelError(data?.error || "Gagal memproses pembatalan pesanan.");
        return;
      }

      // Update state bookings secara optimis
      setBookings((prev) =>
        prev.map((item) =>
          item.id === cancellingBooking.id
            ? {
                ...item,
                status: data.data?.status || (isPaidOrApproved ? "REFUND_REQUESTED" : "CANCELLED"),
                cancellation_reason: data.data?.cancellation_reason || finalReason,
                refund_bank_name: data.data?.refund_bank_name || finalBank,
                refund_account_number: data.data?.refund_account_number || cancelAccountNumber.trim(),
                refund_account_holder: data.data?.refund_account_holder || cancelAccountHolder.trim(),
              }
            : item
        )
      );

      setCancelSuccessMsg(data.message || "Pesanan berhasil dibatalkan.");
      setTimeout(() => setCancelSuccessMsg(null), 5000);
      setCancellingBooking(null);
    } catch (err) {
      console.error("Gagal mengirim pembatalan:", err);
      setCancelError("Terjadi kesalahan jaringan saat memproses pembatalan.");
    } finally {
      setIsSubmittingCancel(false);
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Back Navigation Link */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/search");
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-emerald-600 transition-all" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Header Title Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shrink-0">
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {user?.name || "Pengguna KosPasti"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              {user?.bio && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-1 max-w-md">
                  &ldquo;{user.bio}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar Navigation + Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar Menu */}
          <aside className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Pesanan</span>
              </button>

              <hr className="my-1 border-slate-100 dark:border-slate-800 hidden lg:block" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
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
                              {/* Custom Radio Button */}
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
                    {/* Foto Profil Uploader */}
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

                    {/* Input Email (Read-Only) */}
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

                    {/* Input Nama Lengkap */}
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

                    {/* Input WhatsApp */}
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

                    {/* Textarea Bio Singkat */}
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
            )}

            {/* TAB 2: RIWAYAT PESANAN */}
            {activeTab === "bookings" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Pemesanan Kos</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Daftar semua permohonan dan transaksi sewa kos yang pernah Anda buat.
                  </p>
                </div>

                {/* Banner Feedback Pembatalan */}
                {cancelSuccessMsg && (
                  <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{cancelSuccessMsg}</span>
                  </div>
                )}

                {isLoadingBookings ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
                    <p className="text-sm">Memuat riwayat pesanan...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Belum Ada Riwayat Pesanan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                      Anda belum pernah mengajukan sewa kos. Temukan kos impian Anda sekarang!
                    </p>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                    >
                      <span>Cari Kos Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputeSuccessMsg && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{disputeSuccessMsg}</span>
                      </div>
                    )}
                    {bookings.map((booking) => {
                      const canCancel = ["PENDING", "PAID", "APPROVED", "ACCEPTED"].includes(
                        booking.status?.toUpperCase()
                      );

                      return (
                        <div
                          key={booking.id}
                          className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition-colors flex flex-col gap-4"
                        >
                          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                            <div className="flex gap-4">
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                {booking.property?.image_url ? (
                                  <Image
                                    src={booking.property.image_url}
                                    alt={booking.property.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                                    <Building className="w-8 h-8" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    {booking.property?.name || "Kos"}
                                  </h3>
                                  {booking.property?.gender_type && (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      {booking.property.gender_type}
                                    </span>
                                  )}
                                </div>

                                {booking.property?.address && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                    <span>{booking.property.address}</span>
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
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

                            <div className="w-full sm:w-auto flex sm:flex-col justify-between sm:items-end items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                              {renderStatusBadge(booking.status)}

                              <div className="text-right">
                                <span className="text-xs text-slate-500 block">Biaya Sewa</span>
                                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                                  {formatRupiah(booking.property?.price_per_month || 0)}
                                  <span className="text-xs font-medium text-slate-500">/bln</span>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1 w-full sm:w-auto justify-end">
                                {booking.status?.toUpperCase() === "PENDING" && (
                                  <Link
                                    href={`/checkout/${booking.id}`}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all cursor-pointer text-center"
                                  >
                                    <span>Bayar Sekarang</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                )}

                                {canCancel && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelModal(booking)}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-xl transition-all active:scale-95 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Batalkan Pesanan</span>
                                  </button>
                                )}

                                {booking.property?.id && (
                                  <Link
                                    href={`/kos/${booking.property.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline px-2 py-1"
                                  >
                                    <span>Lihat Kos</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Grace period & Dispute Banner for COMPLETED booking */}
                          {booking.status?.toUpperCase() === "COMPLETED" && (() => {
                            const confirmedAt = booking.checkin_confirmed_at
                              ? new Date(booking.checkin_confirmed_at)
                              : null;
                            const deadline = confirmedAt
                              ? new Date(confirmedAt.getTime() + 12 * 60 * 60 * 1000)
                              : null;
                            const isWithinGracePeriod = deadline ? Date.now() < deadline.getTime() : false;

                            if (isWithinGracePeriod && deadline) {
                              const diffMs = deadline.getTime() - Date.now();
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                              return (
                                <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Check-In Dikonfirmasi Mitra (Masa Tenggang 12 Jam)</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                      Sisa waktu pengajuan masalah kamar:{" "}
                                      <strong className="text-indigo-700 dark:text-indigo-300">
                                        {diffHours} jam {diffMins} menit lagi
                                      </strong>
                                      . Jika tidak ada sanggahan, dana akan otomatis diteruskan ke mitra.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDisputeBooking(booking);
                                      setDisputeReason("");
                                      setDisputeError(null);
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                                  >
                                    Laporkan Masalah
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Check-in selesai dan masa tenggang telah berakhir. Selamat menikmati kamar kos Anda!</span>
                              </div>
                            );
                          })()}

                          {/* Dispute Info Banner */}
                          {booking.status?.toUpperCase() === "DISPUTED" && (
                            <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Laporan Kendala (Dispute) Sedang Ditangani</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Tim Admin KosPasti sedang menginvestigasi laporan Anda dan menahan pencairan dana ke mitra. Kami akan segera menghubungi Anda.
                              </p>
                              {booking.cancellation_reason && (
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                                  <strong>Keterangan masalah:</strong> {booking.cancellation_reason}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Info Pembatalan / Refund Details jika ada */}
                          {(booking.cancellation_reason && booking.status?.toUpperCase() !== "DISPUTED" || booking.refund_bank_name || booking.refund_note) && (
                            <div className="mt-1 pt-3 border-t border-slate-150 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl text-xs space-y-1">
                              {booking.cancellation_reason && booking.status?.toUpperCase() !== "DISPUTED" && (
                                <p className="text-slate-700 dark:text-slate-300">
                                  <strong className="text-slate-800 dark:text-slate-200">Alasan Pembatalan:</strong>{" "}
                                  {booking.cancellation_reason}
                                </p>
                              )}
                              {booking.refund_bank_name && (
                                <p className="text-slate-600 dark:text-slate-400">
                                  <strong className="text-slate-700 dark:text-slate-300">Rekening Tujuan Refund:</strong>{" "}
                                  {booking.refund_bank_name} - {booking.refund_account_number} a.n. {booking.refund_account_holder}
                                </p>
                              )}
                              {booking.refund_note && (
                                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  <strong>Catatan Refund:</strong> {booking.refund_note}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MODAL PEMBATALAN & PENGAJUAN REFUND */}
            {cancellingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-float space-y-5 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {["PAID", "APPROVED", "ACCEPTED"].includes(cancellingBooking.status?.toUpperCase())
                          ? "Pengajuan Pembatalan & Refund"
                          : "Batalkan Pemesanan"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Kos: <strong className="text-slate-800 dark:text-slate-200">{cancellingBooking.property.name}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCancellingBooking(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {cancelError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{cancelError}</span>
                    </div>
                  )}

                  {["PAID", "APPROVED", "ACCEPTED"].includes(cancellingBooking.status?.toUpperCase()) ? (
                    <form onSubmit={handleSubmitCancel} className="space-y-4">
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                        Dana DP Anda dijamin aman melalui sistem escrow KosPasti. Mohon berikan informasi rekening atau akun e-wallet Anda untuk proses pengembalian dana.
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Alasan Pembatalan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={cancelReasonCategory}
                          onChange={(e) => setCancelReasonCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Perubahan rencana kuliah/studi">Perubahan rencana kuliah/studi</option>
                          <option value="Salah memilih tipe kamar atau lokasi">Salah memilih tipe kamar atau lokasi</option>
                          <option value="Menemukan alternatif hunian lain">Menemukan alternatif hunian lain</option>
                          <option value="Tidak jadi merantau">Tidak jadi merantau</option>
                          <option value="Lainnya">Alasan lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Keterangan Tambahan
                        </label>
                        <textarea
                          rows={2}
                          value={cancelCustomReason}
                          onChange={(e) => setCancelCustomReason(e.target.value)}
                          placeholder="Jelaskan secara singkat alasan pembatalan..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Bank / E-Wallet Tujuan <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={cancelBankName}
                            onChange={(e) => setCancelBankName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="BCA">Bank BCA</option>
                            <option value="Mandiri">Bank Mandiri</option>
                            <option value="BNI">Bank BNI</option>
                            <option value="BRI">Bank BRI</option>
                            <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                            <option value="GoPay">GoPay</option>
                            <option value="OVO">OVO</option>
                            <option value="DANA">DANA</option>
                            <option value="ShopeePay">ShopeePay</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                          {cancelBankName === "Lainnya" && (
                            <input
                              type="text"
                              required
                              placeholder="Ketik nama bank/e-wallet"
                              value={cancelCustomBank}
                              onChange={(e) => setCancelCustomBank(e.target.value)}
                              className="mt-1.5 w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Nomor Rekening / No HP <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 1234567890 / 0812xxx"
                            value={cancelAccountNumber}
                            onChange={(e) => setCancelAccountNumber(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Nama Pemilik Rekening (Sesuai Buku Tabungan / Akun) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap pemilik rekening"
                          value={cancelAccountHolder}
                          onChange={(e) => setCancelAccountHolder(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCancellingBooking(null)}
                          disabled={isSubmittingCancel}
                          className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingCancel}
                          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingCancel ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengirim Pengajuan...</span>
                            </>
                          ) : (
                            <span>Kirim Pengajuan Pembatalan</span>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Modal pembatalan untuk pesanan PENDING (belum bayar) */
                    <form onSubmit={handleSubmitCancel} className="space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Pesanan ini belum dibayar. Jika Anda membatalkan, pesanan akan langsung ditutup dan kamar akan kembali tersedia untuk penyewa lain.
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Alasan Pembatalan
                        </label>
                        <select
                          value={cancelReasonCategory}
                          onChange={(e) => setCancelReasonCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Perubahan rencana kuliah/studi">Perubahan rencana kuliah/studi</option>
                          <option value="Salah memilih tipe kamar atau lokasi">Salah memilih tipe kamar atau lokasi</option>
                          <option value="Menemukan alternatif hunian lain">Menemukan alternatif hunian lain</option>
                          <option value="Tidak jadi merantau">Tidak jadi merantau</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCancellingBooking(null)}
                          disabled={isSubmittingCancel}
                          className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          Kembali
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingCancel}
                          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingCancel ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Membatalkan...</span>
                            </>
                          ) : (
                            <span>Ya, Batalkan Pesanan</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* MODAL LAPORKAN MASALAH / DISPUTE */}
            {disputeBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-float space-y-5 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Laporkan Masalah Check-In
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {disputeBooking.property.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDisputeBooking(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {disputeError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{disputeError}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    Pengajuan masalah akan menahan dana sewa Anda di sistem Escrow KosPasti agar tidak dicairkan ke pemilik kos. Tim Admin akan memverifikasi laporan Anda secepatnya.
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!disputeReason.trim()) {
                        setDisputeError("Mohon deskripsikan masalah yang Anda alami.");
                        return;
                      }

                      setIsSubmittingDispute(true);
                      setDisputeError(null);

                      try {
                        const res = await fetch(`/api/user/bookings/${disputeBooking.id}/dispute`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reason: disputeReason.trim() }),
                        });

                        const data = await res.json();
                        if (!res.ok || !data.success) {
                          throw new Error(data.error || "Gagal mengajukan dispute.");
                        }

                        setDisputeSuccessMsg("Laporan masalah Anda berhasil diajukan. Tim Admin akan segera menghubungi Anda.");
                        setDisputeBooking(null);

                        // Reload bookings
                        const refreshRes = await fetch("/api/user/bookings");
                        const refreshData = await refreshRes.json();
                        if (refreshData.success && Array.isArray(refreshData.bookings)) {
                          setBookings(refreshData.bookings);
                        }
                      } catch (err: unknown) {
                        setDisputeError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim laporan.");
                      } finally {
                        setIsSubmittingDispute(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Jelaskan Masalah / Kendala <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Contoh: Kamar tidak sesuai foto, pemilik tidak dapat dihubungi saat check-in, atau fasilitas utama rusak."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isSubmittingDispute}
                        onClick={() => setDisputeBooking(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingDispute}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-soft hover:shadow-float transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingDispute ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengirim Laporan...</span>
                          </>
                        ) : (
                          <span>Kirim Laporan Masalah</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
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

