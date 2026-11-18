"use client";

import { useState, useEffect, useRef, Suspense, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  User as UserIcon,
  History,
  LogOut,
  Loader2,
  CalendarClock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  saveCachedBookings,
  getCachedBookings,
  saveCachedUserProfile,
  getCachedUserProfile,
  clearOfflineCaches,
  useNetworkStatus,
} from "@/lib/offline-storage";
import { UserProfile, BookingItem, VisitScheduleItem } from "@/types/profile";
import { ProfileInfoTab } from "@/components/profile/ProfileInfoTab";
import { BookingsTab } from "@/components/profile/BookingsTab";
import { VisitsTab } from "@/components/profile/VisitsTab";
import { SecurityTab } from "@/components/profile/SecurityTab";

type TabKey = "profile" | "bookings" | "visits" | "security";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rawTab = searchParams.get("tab");
  const queryTab: TabKey =
    rawTab === "bookings"
      ? "bookings"
      : rawTab === "visits"
      ? "visits"
      : rawTab === "security"
      ? "security"
      : "profile";

  const [manualTab, setManualTab] = useState<TabKey | null>(null);
  const activeTab = manualTab ?? queryTab;
  const setActiveTab = (tab: TabKey) => setManualTab(tab);

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

  // Visit Schedules State
  const [visits, setVisits] = useState<VisitScheduleItem[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [visitsLoaded, setVisitsLoaded] = useState(false);

  // Logout & Offline State
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isOnline } = useNetworkStatus();
  const [isOfflineBookings, setIsOfflineBookings] = useState(false);
  const [bookingsLastSyncedAt, setBookingsLastSyncedAt] = useState<string | null>(null);

  // 1. Fetch User Profile
  const fetchProfile = async () => {
    const applyCachedProfile = () => {
      const cached = getCachedUserProfile<UserProfile>();
      if (cached?.profile) {
        setUser(cached.profile);
        setName(cached.profile.name || "");
        setWhatsapp(cached.profile.whatsapp || "");
        setBio(cached.profile.bio || "");
        setAvatarPreview(cached.profile.avatar || null);
        return true;
      }
      return false;
    };

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      applyCachedProfile();
      setIsLoadingUser(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile");
      if (res.status === 401) {
        clearOfflineCaches();
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setName(data.user.name || "");
        setWhatsapp(data.user.whatsapp || "");
        setBio(data.user.bio || "");
        setAvatarPreview(data.user.avatar || null);
        saveCachedUserProfile(data.user);
      }
    } catch (error) {
      console.error("Gagal mengambil data profil:", error);
      applyCachedProfile();
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const fetchBookings = async () => {
    const applyCachedBookings = () => {
      const cached = getCachedBookings<BookingItem>();
      if (cached?.bookings) {
        setBookings(cached.bookings);
        setBookingsLoaded(true);
        setIsOfflineBookings(true);
        setBookingsLastSyncedAt(cached.updatedAt);
        return true;
      }
      return false;
    };

    if (bookingsLoaded && isOnline && !isOfflineBookings) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      applyCachedBookings();
      setIsLoadingBookings(false);
      return;
    }

    try {
      setIsLoadingBookings(true);
      const res = await fetch("/api/user/bookings");
      if (res.status === 401) {
        clearOfflineCaches();
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
        setBookingsLoaded(true);
        setIsOfflineBookings(false);
        setBookingsLastSyncedAt(null);
        saveCachedBookings(data.bookings);
      }
    } catch (error) {
      console.error("Gagal mengambil riwayat pesanan:", error);
      applyCachedBookings();
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookingsLoaded, isOnline, isOfflineBookings, router]);

  // 3. Fetch Visits when Visits Tab is active
  const fetchVisits = async () => {
    try {
      setIsLoadingVisits(true);
      const res = await fetch("/api/visits?audience=USER");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.visits)) {
        setVisits(data.visits);
        setVisitsLoaded(true);
      }
    } catch (error) {
      console.error("Gagal mengambil jadwal survei:", error);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  useEffect(() => {
    if (activeTab === "visits" && !visitsLoaded) {
      fetchVisits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, visitsLoaded, router]);

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
      setSaveErrorMessage(
        "Format nomor WhatsApp tidak valid. Gunakan format seperti 08123456789 atau +628123456789."
      );
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
      clearOfflineCaches();
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Gagal logout:", error);
    } finally {
      setIsLoggingOut(false);
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
            <nav
              role="tablist"
              aria-label="Menu Tab Profil"
              className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible"
            >
              <button
                type="button"
                role="tab"
                id="tab-profile"
                aria-selected={activeTab === "profile"}
                aria-controls="panel-profile"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
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
                role="tab"
                id="tab-bookings"
                aria-selected={activeTab === "bookings"}
                aria-controls="panel-bookings"
                onClick={() => setActiveTab("bookings")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeTab === "bookings"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Pesanan</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-visits"
                aria-selected={activeTab === "visits"}
                aria-controls="panel-visits"
                onClick={() => setActiveTab("visits")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeTab === "visits"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                <span>Jadwal Survei</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-security"
                aria-selected={activeTab === "security"}
                aria-controls="panel-security"
                onClick={() => setActiveTab("security")}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeTab === "security"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Keamanan</span>
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
              <div
                role="tabpanel"
                id="panel-profile"
                aria-labelledby="tab-profile"
                tabIndex={0}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm focus:outline-none"
              >
                <ProfileInfoTab
                  user={user}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  name={name}
                  setName={setName}
                  whatsapp={whatsapp}
                  setWhatsapp={setWhatsapp}
                  bio={bio}
                  setBio={setBio}
                  avatarPreview={avatarPreview}
                  fileInputRef={fileInputRef}
                  handleAvatarChange={handleAvatarChange}
                  handleSaveProfile={handleSaveProfile}
                  handleCancelEdit={handleCancelEdit}
                  isSaving={isSaving}
                  saveSuccessMessage={saveSuccessMessage}
                  saveErrorMessage={saveErrorMessage}
                  setSaveSuccessMessage={setSaveSuccessMessage}
                  setSaveErrorMessage={setSaveErrorMessage}
                  themeMounted={themeMounted}
                />
              </div>
            )}

            {/* TAB 2: RIWAYAT PESANAN */}
            {activeTab === "bookings" && (
              <div
                role="tabpanel"
                id="panel-bookings"
                aria-labelledby="tab-bookings"
                tabIndex={0}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm focus:outline-none"
              >
                <BookingsTab
                  bookings={bookings}
                  isLoadingBookings={isLoadingBookings}
                  isOnline={isOnline}
                  isOfflineBookings={isOfflineBookings}
                  bookingsLastSyncedAt={bookingsLastSyncedAt}
                  user={user}
                  onBookingsUpdated={fetchBookings}
                />
              </div>
            )}

            {/* TAB 3: JADWAL SURVEI */}
            {activeTab === "visits" && (
              <div
                role="tabpanel"
                id="panel-visits"
                aria-labelledby="tab-visits"
                tabIndex={0}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm focus:outline-none"
              >
                <VisitsTab
                  visits={visits}
                  isLoadingVisits={isLoadingVisits}
                  onVisitsUpdated={fetchVisits}
                />
              </div>
            )}

            {/* TAB 4: KEAMANAN & KATA SANDI */}
            {activeTab === "security" && (
              <div
                role="tabpanel"
                id="panel-security"
                aria-labelledby="tab-security"
                tabIndex={0}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm focus:outline-none"
              >
                <SecurityTab
                  user={user}
                  onPasswordUpdated={fetchProfile}
                />
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
          <p className="text-sm font-medium">Memuat halaman profil...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
