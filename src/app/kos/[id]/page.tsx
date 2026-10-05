"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Check,
  Home,
  User,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera,
  Clock,
  Sparkles,
  Star,
  Maximize2,
  X,
  Tv,
  FileText,
  ShieldAlert,
  Layers,
  ScrollText,
  BadgeCheck,
} from "lucide-react";
import PropertyLocationMap from "@/components/map/PropertyLocationMap";
import { WishlistButton } from "@/components/features/WishlistButton";
import { ReviewSection } from "@/components/features/ReviewSection";

interface PropertyMediaItem {
  id?: string;
  url: string;
  type: string; // "IMAGE" | "VIDEO"
}

export interface RoomTypeItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  facilities?: string | null;
  specifications?: string | null;
  image_url?: string | null;
}

interface PropertyDetail {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  media?: PropertyMediaItem[];
  room_types?: RoomTypeItem[];
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  rules?: string | null;
  rental_terms?: string | null;
  youtube_url?: string | null;
  average_rating?: number;
  total_reviews?: number;
  updated_at?: string;
  owner?: {
    name: string;
    whatsapp_number: string;
  };
}

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    if (trimmed.includes("youtube.com/embed/")) {
      const match = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : trimmed;
    }
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
    }
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
    }
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeItem | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Media Tab: "PHOTO" atau "VIDEO"
  const [mediaMode, setMediaMode] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [activeIndex, setActiveIndex] = useState(0);

  // Lightbox Modal Fullscreen
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // In-Page Sticky Navigation State
  const [showSubNav, setShowSubNav] = useState(false);
  const [activeSection, setActiveSection] = useState("section-media");
  const subnavScrollRef = useRef<HTMLDivElement>(null);

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [moveInDate, setMoveInDate] = useState("");
  const [minDate, setMinDate] = useState("");

  const handleOpenBookingModal = async (roomTypeToBook?: RoomTypeItem) => {
    if (roomTypeToBook) {
      setSelectedRoomType(roomTypeToBook);
    }
    try {
      setIsCheckingAuth(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.authenticated) {
        const callbackUrl = encodeURIComponent(`/kos/${id}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      }

      if (data.user?.name) {
        setStudentName(data.user.name);
      }
      if (data.user?.whatsapp) {
        setWaNumber(data.user.whatsapp);
      }
      if (data.user?.avatar) {
        setUserAvatar(data.user.avatar);
      } else {
        setUserAvatar(null);
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error("Gagal memeriksa sesi pengguna:", err);
      const callbackUrl = encodeURIComponent(`/kos/${id}`);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!moveInDate) {
      alert("Mohon pilih rencana tanggal masuk Anda.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          roomTypeId: selectedRoomType?.id || undefined,
          studentName: studentName || undefined,
          waNumber: waNumber || undefined,
          moveInDate,
        }),
      });

      const responseData = await response.json();

      if (response.status === 401) {
        alert("Sesi Anda belum login atau telah berakhir. Silakan login kembali.");
        const callbackUrl = encodeURIComponent(`/kos/${id}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Gagal melakukan pemesanan.");
      }

      router.push(`/checkout/${responseData.data.bookingId}`);
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Gagal melakukan pemesanan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    setMinDate(new Date().toISOString().split("T")[0]);
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPropertyDetail() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const [resProperty, resWishlist] = await Promise.all([
          fetch(`/api/properties/${id}`),
          fetch("/api/user/wishlist?idsOnly=true").catch(() => null),
        ]);

        const json = await resProperty.json();
        if (isMounted) {
          if (json.success && json.data) {
            setProperty(json.data);
            setActiveIndex(0);
            if (Array.isArray(json.data.room_types) && json.data.room_types.length > 0) {
              const available = json.data.room_types.find((rt: RoomTypeItem) => rt.available_rooms > 0);
              setSelectedRoomType(available || json.data.room_types[0]);
            }
          } else {
            setError(json.error || "Kos tidak ditemukan");
          }

          if (resWishlist && resWishlist.ok) {
            const wishlistJson = await resWishlist.json();
            if (wishlistJson.success && Array.isArray(wishlistJson.savedIds)) {
              setIsSaved(wishlistJson.savedIds.includes(id));
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal memuat detail kos:", err);
          setError("Terjadi kesalahan saat memuat data kos");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPropertyDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Observer & Scrollspy untuk Sticky In-Page Navigation
  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById("section-media");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        // Muncul bila bagian bawah foto properti sudah melewati batas atas navbar
        setShowSubNav(rect.bottom < 54);
      }

      // Scrollspy: Deteksi section aktif sesuai posisi scroll
      const sectionIds = [
        "section-media",
        "section-deskripsi",
        "section-tipe-kamar",
        "section-fasilitas-kamar",
        "section-fasilitas-umum",
        "section-spesifikasi-aturan",
        "section-ketentuan-sewa",
        "section-lokasi",
        "reviews-section",
      ];

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Jika user sudah mendekati batas bawah halaman, langsung tandai ulasan
      if (scrollPosition + windowHeight >= documentHeight - 60) {
        setActiveSection("reviews-section");
        return;
      }

      // Threshold membaca (di bawah sticky subnav ~160px dari viewport top)
      const offset = 160;
      let currentSection = "section-media";

      for (const sectionId of sectionIds) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= offset) {
            currentSection = sectionId;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll tombol aktif di dalam horizontal subnav jika tersembunyi
  useEffect(() => {
    if (!showSubNav) return;
    const activeBtn = document.getElementById(`subnav-btn-${activeSection}`);
    const container = subnavScrollRef.current;
    if (activeBtn && container) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const btnRight = btnLeft + btnWidth;
      const containerLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const containerRight = containerLeft + containerWidth;

      if (btnLeft < containerLeft) {
        container.scrollTo({ left: Math.max(0, btnLeft - 16), behavior: "smooth" });
      } else if (btnRight > containerRight) {
        container.scrollTo({ left: btnRight - containerWidth + 16, behavior: "smooth" });
      }
    }
  }, [activeSection, showSubNav]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 135;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // Kumpulan Semua Media Foto
  const photoList: PropertyMediaItem[] = useMemo(() => {
    if (!property) return [];
    const list: PropertyMediaItem[] = [];
    if (property.media && property.media.length > 0) {
      const imagesOnly = property.media.filter((m) => m.type !== "VIDEO");
      list.push(...imagesOnly);
    }
    if (property.image_url) {
      const thumbIndex = list.findIndex((m) => m.url === property.image_url);
      if (thumbIndex > 0) {
        const [thumb] = list.splice(thumbIndex, 1);
        list.unshift(thumb);
      } else if (thumbIndex === -1) {
        list.unshift({ url: property.image_url, type: "IMAGE" });
      }
    }
    if (property.room_types && property.room_types.length > 0) {
      for (const rt of property.room_types) {
        if (rt.image_url && !list.some((m) => m.url === rt.image_url)) {
          list.push({ url: rt.image_url, type: "IMAGE" });
        }
      }
    }
    return list;
  }, [property]);

  // Video YouTube Embed URL atau Native Video URL
  const youtubeEmbedUrl = useMemo(() => {
    return getYouTubeEmbedUrl(property?.youtube_url);
  }, [property?.youtube_url]);

  const nativeVideoUrl = useMemo(() => {
    return property?.media?.find((m) => m.type === "VIDEO")?.url || null;
  }, [property?.media]);

  const hasVideo = Boolean(youtubeEmbedUrl || nativeVideoUrl);

  const handleSelectRoomType = (rt: RoomTypeItem) => {
    setSelectedRoomType(rt);
    if (rt.image_url) {
      const foundIdx = photoList.findIndex((m) => m.url === rt.image_url);
      if (foundIdx >= 0) {
        setActiveIndex(foundIdx);
        setMediaMode("PHOTO");
      }
    }
  };

  const prevSlide = () => {
    if (photoList.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (photoList.length <= 1) return;
    setActiveIndex((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
  };

  // Lightbox Navigation Handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const prevLightbox = useCallback(() => {
    if (photoList.length <= 1) return;
    setLightboxIndex((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  }, [photoList.length]);

  const nextLightbox = useCallback(() => {
    if (photoList.length <= 1) return;
    setLightboxIndex((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
  }, [photoList.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextLightbox, prevLightbox]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Memuat detail properti kos...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Kos tidak ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-xs">
            {error || "Data properti yang Anda cari tidak tersedia atau ID tidak valid."}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const currentPhoto = photoList[activeIndex] || null;

  const currentPrice = selectedRoomType ? selectedRoomType.price_per_month : property.price_per_month;
  const formattedPrice = `Rp ${currentPrice.toLocaleString("id-ID")}`;
  const isFull = selectedRoomType
    ? selectedRoomType.available_rooms === 0
    : property.available_rooms === 0;
  const isAvailable = !isFull;
  const normalizedGender = property.gender_type?.toUpperCase() || "";
  const genderBadgeStyle = (() => {
    switch (normalizedGender) {
      case "PUTRA":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PUTRI":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "CAMPUR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  })();

  // Fasilitas Umum Properti
  const generalFacilities = property.facilities
    ? property.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  // Fasilitas Khusus Kamar yang sedang dipilih
  const roomFacilities = selectedRoomType?.facilities
    ? selectedRoomType.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  // Parse Peraturan Kos
  const rulesList = property.rules
    ? property.rules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  // Parse Ketentuan Pengajuan Sewa
  const rentalTermsList = property.rental_terms
    ? property.rental_terms
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-slate-50 pb-24 lg:pb-12 px-0 lg:px-8 flex flex-col relative shadow-sm w-full min-w-0">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-3">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              aria-label="Kembali ke beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-bold text-slate-800 truncate">
              {property.name}
            </h1>
          </div>
          <WishlistButton
            propertyId={property.id}
            initialIsSaved={isSaved}
            variant="button"
            showText
            onToggle={(saved) => setIsSaved(saved)}
          />
        </div>
      </div>

      {/* Sticky In-Page Navigation Bar (Smooth slide-in saat scroll ke bawah melewati foto properti) */}
      <div
        className={`sticky top-[53px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-all duration-300 ease-in-out w-full min-w-0 ${
          showSubNav
            ? "max-h-20 opacity-100 translate-y-0 pointer-events-auto"
            : "max-h-0 opacity-0 -translate-y-3 pointer-events-none border-transparent overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <div
            ref={subnavScrollRef}
            className="relative flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-600 whitespace-nowrap flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
          >
            <button
              id="subnav-btn-section-media"
              type="button"
              onClick={() => scrollToSection("section-media")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-media"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Foto Properti
            </button>
            {property.description && (
              <button
                id="subnav-btn-section-deskripsi"
                type="button"
                onClick={() => scrollToSection("section-deskripsi")}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === "section-deskripsi"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Deskripsi
              </button>
            )}
            {property.room_types && property.room_types.length > 0 && (
              <button
                id="subnav-btn-section-tipe-kamar"
                type="button"
                onClick={() => scrollToSection("section-tipe-kamar")}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === "section-tipe-kamar"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Tipe Kamar
              </button>
            )}
            <button
              id="subnav-btn-section-fasilitas-kamar"
              type="button"
              onClick={() => scrollToSection("section-fasilitas-kamar")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-fasilitas-kamar"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Fasilitas Kamar
            </button>
            <button
              id="subnav-btn-section-fasilitas-umum"
              type="button"
              onClick={() => scrollToSection("section-fasilitas-umum")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-fasilitas-umum"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Fasilitas Umum
            </button>
            <button
              id="subnav-btn-section-spesifikasi-aturan"
              type="button"
              onClick={() => scrollToSection("section-spesifikasi-aturan")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-spesifikasi-aturan"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Spesifikasi &amp; Aturan
            </button>
            {rentalTermsList.length > 0 && (
              <button
                id="subnav-btn-section-ketentuan-sewa"
                type="button"
                onClick={() => scrollToSection("section-ketentuan-sewa")}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === "section-ketentuan-sewa"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Ketentuan Sewa
              </button>
            )}
            <button
              id="subnav-btn-section-lokasi"
              type="button"
              onClick={() => scrollToSection("section-lokasi")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-lokasi"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Lokasi
            </button>
            <button
              id="subnav-btn-reviews-section"
              type="button"
              onClick={() => scrollToSection("reviews-section")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "reviews-section"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Ulasan
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO MEDIA SECTION: FULL WIDTH KE KANAN SESUAI PERMINTAAN USER         */}
      {/* ========================================================================= */}
      <div id="section-media" className="w-full lg:mt-6">
        <div className="w-full bg-slate-950 lg:rounded-3xl overflow-hidden shadow-md flex flex-col">
          {/* Header Switcher Tab: Foto vs Video */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMediaMode("PHOTO")}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaMode === "PHOTO"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto ({photoList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaMode("VIDEO")}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaMode === "VIDEO"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Video {hasVideo ? "Tour" : ""}</span>
              </button>
            </div>

            {mediaMode === "PHOTO" && photoList.length > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(activeIndex)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
                title="Buka gambar fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka Fullscreen</span>
              </button>
            )}
          </div>

          {/* Media Player / Viewer */}
          <div className="w-full h-80 sm:h-96 lg:h-[460px] relative bg-black flex items-center justify-center overflow-hidden">
            {mediaMode === "VIDEO" ? (
              // Tampilan Video YouTube / Native
              <div className="w-full h-full flex items-center justify-center bg-black">
                {youtubeEmbedUrl ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`Video Tour - ${property.name}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : nativeVideoUrl ? (
                  <video
                    src={nativeVideoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                      <Tv className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        Belum Ada Video Tour
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                        Pemilik kos belum menambahkan link video YouTube untuk kos ini. Silakan lihat galeri foto di tab Foto.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaMode("PHOTO")}
                      className="mt-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Beralih ke Foto
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Tampilan Foto Galeri
              <div
                className="w-full h-full relative cursor-pointer group flex items-center justify-center"
                onClick={() => openLightbox(activeIndex)}
              >
                {currentPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentPhoto.url}
                    alt={`${property.name} - Foto ${activeIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Home className="w-12 h-12 stroke-[1.5]" />
                    <span className="text-xs">Foto tidak tersedia</span>
                  </div>
                )}

                {/* Overlay Hint Klik Fullscreen */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <Maximize2 className="w-4 h-4" />
                    <span>Klik untuk melihat Fullscreen &amp; Geser</span>
                  </div>
                </div>

                {/* Tombol Navigasi Kiri / Kanan */}
                {photoList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevSlide();
                      }}
                      aria-label="Foto sebelumnya"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextSlide();
                      }}
                      aria-label="Foto berikutnya"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Counter Badge */}
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-10 shadow-md">
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {activeIndex + 1} / {photoList.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thumbnails Bar (Hanya di mode PHOTO) */}
          {mediaMode === "PHOTO" && photoList.length > 1 && (
            <div className="bg-slate-950 border-t border-slate-900 p-3 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
              {photoList.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Pilih foto ${idx + 1}`}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeIndex === idx
                      ? "border-emerald-500 ring-2 ring-emerald-500/50 opacity-100 scale-102"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT SECTION: DI BAWAH FOTO PROPERTI (KONTEN KIRI & AMANKAN KANAN) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-6 px-4 sm:px-6 lg:px-0 min-w-0">
        {/* KOLOM KIRI (Informasi Utama, Pilihan Tipe, Fasilitas Kamar, Fasilitas Umum, Aturan, dll) */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Card 1: Informasi Dasar Properti */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2.5">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border ${genderBadgeStyle}`}
              >
                {property.gender_type}
              </span>
              {isAvailable ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                  Tersedia {property.available_rooms} Kamar
                </span>
              ) : (
                <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold px-3 py-1 rounded-full">
                  Kamar Penuh
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {property.name}
                </h2>
                {property.average_rating !== undefined && property.average_rating > 0 ? (
                  <a
                    href="#reviews-section"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{property.average_rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-medium underline decoration-slate-300 underline-offset-2">
                      ({property.total_reviews} ulasan)
                    </span>
                  </a>
                ) : (
                  <a
                    href="#reviews-section"
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Belum ada ulasan
                  </a>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <p className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                  {formattedPrice}
                </p>
                {selectedRoomType && (
                  <span className="text-xs font-semibold text-slate-500">
                    ({selectedRoomType.name})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Deskripsi Kos (Di Atas Card Tipe Kamar) */}
          {property.description && (
            <div id="section-deskripsi" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="text-base font-bold text-slate-900">Deskripsi Kos</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {property.description}
              </p>
            </div>
          )}

          {/* Card 3: Pilihan Tipe Kamar (Tanpa Fasilitas di dalamnya sesuai instruksi) */}
          {property.room_types && property.room_types.length > 0 && (
            <div id="section-tipe-kamar" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-base font-bold text-slate-900">Pilihan Tipe Kamar</h3>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {property.room_types.length} Tipe Tersedia
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {property.room_types.map((rt) => {
                  const isSelected = selectedRoomType?.id === rt.id;
                  const isRoomAvailable = rt.available_rooms > 0;

                  return (
                    <div
                      key={rt.id}
                      onClick={() => handleSelectRoomType(rt)}
                      className={`group p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {rt.image_url ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rt.image_url}
                              alt={rt.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 text-slate-400">
                            <Home className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}

                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
                              {rt.name}
                            </span>
                            {isRoomAvailable ? (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                Sisa {rt.available_rooms} Kamar
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Penuh
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                Dipilih
                              </span>
                            )}
                          </div>

                          {rt.specifications && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {rt.specifications}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Select Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Harga Kamar</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600">
                            Rp {rt.price_per_month.toLocaleString("id-ID")}
                            <span className="text-xs font-medium text-slate-500"> /bln</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRoomType(rt);
                            handleOpenBookingModal(rt);
                          }}
                          disabled={!isRoomAvailable || isCheckingAuth}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            !isRoomAvailable
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                              : isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {!isRoomAvailable ? "Penuh" : isSelected ? "Pilih & Pesan" : "Pilih Tipe Ini"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* Card 4: FASILITAS KAMAR (CARD BARU DI ATAS FASILITAS UMUM - DINAMIS)       */}
          {/* ========================================================================= */}
          <div id="section-fasilitas-kamar" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h3 className="text-base font-bold text-slate-900">
                  Fasilitas Kamar
                </h3>
              </div>
              {selectedRoomType && (
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  Tipe: {selectedRoomType.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(roomFacilities.length > 0
                ? roomFacilities
                : ["Kasur / Springbed", "Lemari Pakaian", "Ventilasi / Jendela", "Meja & Kursi"]
              ).map((fac, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-slate-700 bg-teal-50/50 p-3 rounded-xl border border-teal-100/80 hover:border-teal-300 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold truncate">{fac}</span>
                </div>
              ))}
            </div>

            {/* Spesifikasi Tipe Kamar */}
            {selectedRoomType?.specifications && (
              <div className="mt-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>Spesifikasi Kamar ({selectedRoomType.name})</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedRoomType.specifications}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* Card 5: FASILITAS UMUM (SEBELUMNYA FASILITAS BERSAMA & BANGUNAN)          */}
          {/* ========================================================================= */}
          <div id="section-fasilitas-umum" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-base font-bold text-slate-900">Fasilitas Umum</h3>
            </div>

            {generalFacilities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {generalFacilities.map((facility, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-100/70 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span className="truncate font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {property.facilities || "Tidak ada rincian fasilitas umum"}
              </p>
            )}
          </div>

          {/* ========================================================================= */}
          {/* Card 5: SPESIFIKASI, KEBIJAKAN & PERATURAN TIAP KOSAN                     */}
          {/* ========================================================================= */}
          <div id="section-spesifikasi-aturan" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-base font-bold text-slate-900">Peraturan &amp; Kebijakan Kos</h3>
            </div>

            {/* Badges Akses & Hewan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-center gap-3 text-xs p-3.5 rounded-xl border transition-colors ${
                  property.is_24_hours
                    ? "bg-slate-50/80 text-slate-800 border-slate-200/90 shadow-2xs"
                    : "bg-slate-50/40 text-slate-500 border-slate-200/60"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    property.is_24_hours
                      ? "bg-slate-200 text-slate-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    {property.is_24_hours ? "Akses Bebas 24 Jam" : "Ada Jam Malam"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {property.is_24_hours
                      ? "Bebas keluar masuk tanpa pembatasan jam malam"
                      : "Gerbang ditutup pada jam tertentu demi keamanan"}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 text-xs p-3.5 rounded-xl border transition-colors ${
                  property.is_pet_friendly
                    ? "bg-emerald-50/40 text-emerald-900 border-emerald-200 shadow-2xs"
                    : "bg-slate-50/40 text-slate-500 border-slate-200/60"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    property.is_pet_friendly
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    {property.is_pet_friendly ? "Boleh Bawa Hewan" : "Dilarang Bawa Hewan"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {property.is_pet_friendly
                      ? "Hewan peliharaan (kucing/anjing kecil) diizinkan"
                      : "Tidak diperkenankan membawa hewan peliharaan"}
                  </p>
                </div>
              </div>
            </div>

            {/* List Peraturan Kos */}
            <div className="mt-2 pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Tata Tertib &amp; Peraturan Kos</span>
              </div>

              {rulesList.length > 0 ? (
                <div className="space-y-2">
                  {rulesList.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 bg-amber-50/40 p-3 rounded-xl border border-amber-100/70"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-200/70 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-medium">{rule}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  Penyewa diwajibkan menjaga ketertiban, kebersihan, dan saling menghormati kenyamanan sesama penghuni kos.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Card 6: KETENTUAN PENGAJUAN SEWA                                         */}
          {/* ========================================================================= */}
          <div id="section-ketentuan-sewa" className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-base font-bold text-slate-900">Ketentuan Pengajuan Sewa</h3>
            </div>

            {rentalTermsList.length > 0 ? (
              <div className="space-y-2.5">
                {rentalTermsList.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-xs text-slate-700 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/70"
                  >
                    <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{term}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Wajib melampirkan foto KTP atau Kartu Tanda Mahasiswa yang masih berlaku.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pembayaran sewa dilakukan di muka saat konfirmasi pemesanan diterima.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Konfirmasi sewa berlaku setelah pemilik kos memverifikasi data Anda.</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 7: Lokasi & Rute Google Maps */}
          <div id="section-lokasi">
            <PropertyLocationMap
              propertyName={property.name}
              address={property.address}
              latitude={property.latitude}
              longitude={property.longitude}
            />
          </div>

          {/* Card 8: Info Pemilik / Pengelola */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-2xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Dikelola oleh
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {property.owner?.name || "Pemilik Kos"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 9: Ulasan & Rating Penyewa */}
          <div id="reviews-section">
            <ReviewSection propertyId={property.id} propertyName={property.name} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM KANAN (KARTU AMANKAN KAMAR STICKY DI BAWAH FOTO PROPERTI)          */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200/80 p-4 flex justify-between items-center z-40 lg:static lg:block lg:p-6 lg:border lg:border-slate-200/60 lg:rounded-2xl lg:shadow-soft lg:sticky lg:top-32">
            <div className="max-w-md mx-auto lg:max-w-none w-full flex justify-between lg:flex-col lg:gap-4 items-center lg:items-start">
              <div className="lg:w-full">
                <p className="text-[10px] lg:text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {selectedRoomType ? `Harga (${selectedRoomType.name})` : "Harga per bulan"}
                </p>
                <p className="text-lg lg:text-3xl font-black text-slate-900 mt-0.5">
                  {formattedPrice}{" "}
                  <span className="text-xs lg:text-sm font-medium text-slate-500">
                    / bln
                  </span>
                </p>
                {isFull && (
                  <p className="text-[11px] lg:text-xs text-rose-500 font-semibold mt-1">
                    Mohon maaf, tipe kamar ini telah penuh.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isFull || isCheckingAuth}
                onClick={() => handleOpenBookingModal()}
                className={`px-6 py-2.5 lg:py-3.5 lg:w-full rounded-xl font-bold text-white transition-all duration-200 cursor-pointer shadow-sm ${
                  isFull || isCheckingAuth
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                }`}
              >
                {isFull
                  ? "Kamar Penuh"
                  : isCheckingAuth
                  ? "Memeriksa..."
                  : "Amankan Kamar"}
              </button>

              {/* Jaminan KosPasti */}
              <div className="hidden lg:flex flex-col gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500 w-full">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pasti Sesuai Deskripsi &amp; Foto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tanpa Biaya Tambahan Tersembunyi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Konfirmasi Langsung Pemilik</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX MODAL FULLSCREEN (BISA DI-GESER DENGAN SWIPE / TOMBOL / KEYBOARD) */}
      {/* ========================================================================= */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-between animate-in fade-in duration-200 backdrop-blur-sm select-none">
          {/* Lightbox Header */}
          <div className="px-4 py-3 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold">
                Foto {lightboxIndex + 1} dari {photoList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Tutup Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image Viewer */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            {photoList[lightboxIndex] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photoList[lightboxIndex].url}
                alt={`${property.name} - Foto ${lightboxIndex + 1}`}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
              />
            )}

            {/* Prev / Next Arrows */}
            {photoList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevLightbox}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextLightbox}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Slider */}
          {photoList.length > 1 && (
            <div className="bg-black/80 border-t border-white/10 p-3 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none z-10">
              {photoList.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    lightboxIndex === idx
                      ? "border-emerald-500 scale-105 opacity-100 ring-2 ring-emerald-500/50"
                      : "border-white/20 opacity-40 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOOKING FORM MODAL                                                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Konfirmasi Pemesanan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih rencana tanggal mulai masuk untuk kamar kos ini.
              </p>
            </div>

            {/* Selected Room Type Info */}
            {selectedRoomType && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                    Tipe Kamar Dipilih
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedRoomType.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-emerald-700">
                    Rp {selectedRoomType.price_per_month.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500">/ bulan</p>
                </div>
              </div>
            )}

            {/* User Profile Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Data Pemesan (Akun Anda)
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Terverifikasi
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={studentName || "Foto Profil"}
                      fill
                      className="object-cover rounded-full"
                      unoptimized={userAvatar.startsWith("blob:") || userAvatar.startsWith("data:")}
                    />
                  ) : (
                    <span>
                      {studentName
                        ? studentName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0].toUpperCase())
                            .join("")
                        : <User className="w-4 h-4" />}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {studentName || "Pengguna"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {waNumber ? `WhatsApp: ${waNumber}` : "Nomor WhatsApp akun"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rencana Tanggal Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 bg-white"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleBookingSubmit}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200 cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Memproses..." : "Lanjut Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
