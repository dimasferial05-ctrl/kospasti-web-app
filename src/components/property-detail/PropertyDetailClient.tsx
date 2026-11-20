"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Home,
  Clock,
  PawPrint,
  Star,
  ShieldAlert,
  Layers,
  BadgeCheck,
  Share2,
} from "lucide-react";
import PropertyLocationMap from "@/components/map/PropertyLocationMap";
import { CampusCommuteEstimator, CommuteLocation } from "@/components/features/CampusCommuteEstimator";
import { WishlistButton } from "@/components/features/WishlistButton";
import { CompareButton } from "@/components/features/CompareButton";
import { ReviewSection } from "@/components/features/ReviewSection";
import { SimilarPropertiesSection } from "@/components/features/SimilarPropertiesSection";
import {
  ScheduleVisitModal,
  getLocalScheduledVisit,
  saveLocalScheduledVisit,
  type ExistingVisitSummary,
} from "@/components/features/ScheduleVisitModal";
import { PropertyGalleryViewer } from "@/components/property-detail/PropertyGalleryViewer";
import { PropertyBookingModal } from "@/components/property-detail/PropertyBookingModal";
import { PropertyStickyBottomBar } from "@/components/property-detail/PropertyStickyBottomBar";
import { PropertyOwnerContactCard } from "@/components/property-detail/PropertyOwnerContactCard";
import type { PropertyDetail, RoomTypeItem, PropertyMediaItem } from "@/lib/property-detail";

export type { PropertyDetail, RoomTypeItem, PropertyMediaItem };

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

interface PropertyDetailClientProps {
  initialProperty: PropertyDetail;
}

export default function PropertyDetailClient({ initialProperty }: PropertyDetailClientProps) {
  const router = useRouter();
  const id = initialProperty?.id;

  const [property] = useState<PropertyDetail>(initialProperty);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeItem | null>(() => {
    if (Array.isArray(initialProperty?.room_types) && initialProperty.room_types.length > 0) {
      const available = initialProperty.room_types.find((rt) => rt.available_rooms > 0);
      return available || initialProperty.room_types[0];
    }
    return null;
  });

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<CommuteLocation | null>(null);

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
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [existingVisit, setExistingVisit] = useState<ExistingVisitSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<boolean>(false);
  const [studentName, setStudentName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [moveInDate, setMoveInDate] = useState("");

  const handleShare = async () => {
    if (typeof window === "undefined" || !property) return;

    const shareData = {
      title: property.name,
      text: `Cek kos ${property.name} di KosPasti!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error("Gagal membagikan:", err);
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Gagal menyalin tautan:", err);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [minDate, setMinDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pendingBookingNotice, setPendingBookingNotice] = useState<{
    isOpen: boolean;
    message: string;
    bookingId?: string;
  }>({
    isOpen: false,
    message: "",
  });

  const handleOpenBookingModal = async (roomTypeToBook?: RoomTypeItem) => {
    setBookingError(null);
    setDateValidationError(false);
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

  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const handleOpenDirectChat = async () => {
    if (!property?.id || isOpeningChat) return;
    setIsOpeningChat(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: property.id }),
      });
      if (res.status === 401) {
        const callbackUrl = encodeURIComponent(`/kos/${property.id}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.room?.id) {
        router.push(`/chat/${data.room.id}`);
      } else if (data.is_own_property) {
        router.push(data.redirect_url || "/partner/dashboard/chats");
      } else {
        console.error(data.error || "Gagal membuka ruang obrolan.");
      }
    } catch {
      console.error("Terjadi kesalahan saat menghubungkan ke obrolan.");
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!moveInDate) {
      setDateValidationError(true);
      setBookingError("Mohon pilih rencana tanggal masuk Anda.");
      return;
    }

    setBookingError(null);
    setDateValidationError(false);
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
        setBookingError("Sesi Anda belum login atau telah berakhir. Mengarahkan ke halaman login...");
        const callbackUrl = encodeURIComponent(`/kos/${id}`);
        setTimeout(() => {
          router.push(`/login?callbackUrl=${callbackUrl}`);
        }, 1200);
        return;
      }

      if (!response.ok) {
        if (responseData.hasPendingBooking) {
          setIsModalOpen(false);
          setPendingBookingNotice({
            isOpen: true,
            message:
              responseData.error ||
              "Ups! Kamu masih punya pesanan yang menunggu pembayaran. Yuk, selesaikan dulu pembayarannya di menu Profil.",
            bookingId: responseData.pendingBookingId,
          });
          return;
        }
        throw new Error(responseData.error || "Gagal melakukan pemesanan.");
      }

      router.push(`/checkout/${responseData.data.bookingId}`);
    } catch (error: unknown) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Gagal melakukan pemesanan. Silakan periksa koneksi Anda dan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [id]);

  // Non-blocking fetch untuk preferensi pengguna (wishlist & scheduled visit)
  useEffect(() => {
    let isMounted = true;

    async function fetchUserPreferences() {
      if (!id) return;
      try {
        const [resWishlist, resVisit] = await Promise.all([
          fetch("/api/user/wishlist?idsOnly=true").catch(() => null),
          fetch(`/api/visits?propertyId=${encodeURIComponent(id)}`).catch(() => null),
        ]);

        if (isMounted) {
          if (resWishlist && resWishlist.ok) {
            const wishlistJson = await resWishlist.json().catch(() => null);
            if (wishlistJson?.success && Array.isArray(wishlistJson.savedIds)) {
              setIsSaved(wishlistJson.savedIds.includes(id));
            }
          }

          let resolvedExistingVisit: ExistingVisitSummary | null = null;
          if (resVisit && resVisit.ok) {
            const visitJson = await resVisit.json().catch(() => null);
            if (visitJson?.success && visitJson.existingVisit) {
              resolvedExistingVisit = visitJson.existingVisit as ExistingVisitSummary;
              saveLocalScheduledVisit(id, resolvedExistingVisit);
            }
          }
          if (!resolvedExistingVisit) {
            resolvedExistingVisit = getLocalScheduledVisit(id);
          }
          setExistingVisit(resolvedExistingVisit);
        }
      } catch (err) {
        console.error("Gagal memuat data preferensi pengguna:", err);
      }
    }

    fetchUserPreferences();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Observer & Scrollspy untuk Sticky In-Page Navigation
  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById("section-media");
      const similarSection = document.getElementById("section-similar-kos");
      if (hero) {
        const heroRect = hero.getBoundingClientRect();
        const isPastHero = heroRect.bottom < 54;
        let isBeforeSimilar = true;
        if (similarSection) {
          const similarRect = similarSection.getBoundingClientRect();
          isBeforeSimilar = similarRect.top > 140;
        }
        setShowSubNav(isPastHero && isBeforeSimilar);
      }

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

      if (scrollPosition + windowHeight >= documentHeight - 60) {
        setActiveSection("reviews-section");
        return;
      }

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

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Kos tidak ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-xs">
            Data properti yang Anda cari tidak tersedia atau ID tidak valid.
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
        return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "PUTRI":
        return "bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800";
      case "CAMPUR":
        return "bg-purple-50 dark:purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  })();

  const generalFacilities = property.facilities
    ? property.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  const roomFacilities = selectedRoomType?.facilities
    ? selectedRoomType.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];

  const rulesList = property.rules
    ? property.rules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  const rentalTermsList = property.rental_terms
    ? property.rental_terms
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div id="kos-detail-page" className="max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 sm:pb-32 lg:pb-12 px-0 lg:px-8 flex flex-col relative shadow-sm w-full min-w-0">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/search");
                }
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer"
              aria-label="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {property.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs hover:shadow-soft active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Bagikan informasi kos"
              title="Bagikan tautan kos"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="hidden sm:inline">Bagikan</span>
                </>
              )}
            </button>
            <CompareButton
              property={{
                id: property.id,
                name: property.name,
                price: property.price_per_month,
                gender_type: property.gender_type,
                image_url: property.image_url,
                available_rooms: property.available_rooms,
              }}
              variant="button"
            />
            <WishlistButton
              propertyId={property.id}
              initialIsSaved={isSaved}
              variant="button"
              showText
              onToggle={(saved) => setIsSaved(saved)}
            />
          </div>
        </div>
      </div>

      {/* Sticky In-Page Navigation Bar */}
      <div
        className={`sticky top-[53px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-xs transition-all duration-300 ease-in-out w-full min-w-0 ${
          showSubNav
            ? "max-h-20 opacity-100 translate-y-0 pointer-events-auto"
            : "max-h-0 opacity-0 -translate-y-3 pointer-events-none border-transparent overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <div
            ref={subnavScrollRef}
            className="relative flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
          >
            <button
              id="subnav-btn-section-media"
              type="button"
              onClick={() => scrollToSection("section-media")}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === "section-media"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              Ulasan
            </button>
          </div>
        </div>
      </div>

      {/* 1. HERO MEDIA SECTION */}
      <PropertyGalleryViewer
        propertyName={property.name}
        photoList={photoList}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        youtubeEmbedUrl={youtubeEmbedUrl}
        nativeVideoUrl={nativeVideoUrl}
        hasVideo={hasVideo}
        isLightboxOpen={isLightboxOpen}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        openLightbox={openLightbox}
        closeLightbox={closeLightbox}
        prevLightbox={prevLightbox}
        nextLightbox={nextLightbox}
        prevSlide={prevSlide}
        nextSlide={nextSlide}
      />

      {/* 2. BODY CONTENT SECTION */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-6 px-4 sm:px-6 lg:px-0 min-w-0">
        {/* KOLOM KIRI */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Card 1: Informasi Dasar Properti */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2.5">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border ${genderBadgeStyle}`}
              >
                {property.gender_type}
              </span>
              {isAvailable ? (
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                  Tersedia {property.available_rooms} Kamar
                </span>
              ) : (
                <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                  Kamar Penuh
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {property.name}
                </h2>
                {property.average_rating !== undefined && property.average_rating > 0 ? (
                  <a
                    href="#reviews-section"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{property.average_rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-medium underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">
                      ({property.total_reviews} ulasan)
                    </span>
                  </a>
                ) : (
                  <a
                    href="#reviews-section"
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Belum ada ulasan
                  </a>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formattedPrice}
                </p>
                {selectedRoomType && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ({selectedRoomType.name})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Deskripsi Kos */}
          {property.description && (
            <div id="section-deskripsi" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Deskripsi Kos</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {property.description}
              </p>
            </div>
          )}

          {/* Card 3: Pilihan Tipe Kamar */}
          {property.room_types && property.room_types.length > 0 && (
            <div id="section-tipe-kamar" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Pilihan Tipe Kamar</h3>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
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
                          ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {rt.image_url ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 relative border border-slate-200/80 dark:border-slate-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rt.image_url}
                              alt={rt.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700 text-slate-400">
                            <Home className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}

                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {rt.name}
                            </span>
                            {isRoomAvailable ? (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                Sisa {rt.available_rooms} Kamar
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
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
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Harga Kamar</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            Rp {rt.price_per_month.toLocaleString("id-ID")}
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400"> /bln</span>
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
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                              : isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-slate-300"
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

          {/* Card 4: FASILITAS KAMAR */}
          <div id="section-fasilitas-kamar" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Fasilitas Kamar
                </h3>
              </div>
              {selectedRoomType && (
                <span className="text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full">
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
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200 bg-teal-50/50 dark:bg-teal-950/30 p-3 rounded-xl border border-teal-100/80 dark:border-teal-900/50 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold truncate">{fac}</span>
                </div>
              ))}
            </div>

            {selectedRoomType?.specifications && (
              <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Spesifikasi Kamar ({selectedRoomType.name})</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedRoomType.specifications}
                </div>
              </div>
            )}
          </div>

          {/* Card 5: FASILITAS UMUM */}
          <div id="section-fasilitas-umum" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fasilitas Umum</h3>
            </div>

            {generalFacilities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {generalFacilities.map((facility, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-100/70 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {property.facilities || "Tidak ada rincian fasilitas umum"}
              </p>
            )}
          </div>

          {/* Card 6: PERATURAN & KEBIJAKAN */}
          <div id="section-spesifikasi-aturan" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Peraturan &amp; Kebijakan Kos</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-center gap-3 text-xs p-3.5 rounded-xl border transition-colors ${
                  property.is_24_hours
                    ? "bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 shadow-2xs"
                    : "bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    property.is_24_hours
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    {property.is_24_hours ? "Akses Bebas 24 Jam" : "Ada Jam Malam"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {property.is_24_hours
                      ? "Bebas keluar masuk tanpa pembatasan jam malam"
                      : "Gerbang ditutup pada jam tertentu demi keamanan"}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 text-xs p-3.5 rounded-xl border transition-colors ${
                  property.is_pet_friendly
                    ? "bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 shadow-2xs"
                    : "bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    property.is_pet_friendly
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <PawPrint className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    {property.is_pet_friendly ? "Boleh Bawa Hewan" : "Dilarang Bawa Hewan"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {property.is_pet_friendly
                      ? "Hewan peliharaan (kucing/anjing kecil) diizinkan"
                      : "Tidak diperkenankan membawa hewan peliharaan"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Tata Tertib &amp; Peraturan Kos</span>
              </div>

              {rulesList.length > 0 ? (
                <div className="space-y-2">
                  {rulesList.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/40 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100/70 dark:border-amber-900/50"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-medium">{rule}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                  Penyewa diwajibkan menjaga ketertiban, kebersihan, dan saling menghormati kenyamanan sesama penghuni kos.
                </div>
              )}
            </div>
          </div>

          {/* Card 7: KETENTUAN PENGAJUAN SEWA */}
          <div id="section-ketentuan-sewa" className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ketentuan Pengajuan Sewa</h3>
            </div>

            {rentalTermsList.length > 0 ? (
              <div className="space-y-2.5">
                {rentalTermsList.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100/70 dark:border-blue-900/50"
                  >
                    <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{term}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Wajib melampirkan foto KTP atau Kartu Tanda Mahasiswa yang masih berlaku.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pembayaran sewa dilakukan di muka saat konfirmasi pemesanan diterima.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Konfirmasi sewa berlaku setelah pemilik kos memverifikasi data Anda.</span>
                </div>
              </div>
            )}
          </div>

          {/* Estimasi Waktu Tempuh ke Kampus */}
          <CampusCommuteEstimator
            propertyName={property.name}
            propertyLat={property.latitude}
            propertyLng={property.longitude}
            onSelectDestination={setSelectedDestination}
          />

          {/* Lokasi & Rute Google Maps */}
          <div id="section-lokasi">
            <div id="property-map-section">
              <PropertyLocationMap
                propertyName={property.name}
                address={property.address}
                latitude={property.latitude}
                longitude={property.longitude}
                selectedDestination={selectedDestination}
              />
            </div>
          </div>

          {/* Info Pemilik / Pengelola */}
          <PropertyOwnerContactCard property={property} />

          {/* Ulasan & Rating Penyewa */}
          <div id="reviews-section">
            <ReviewSection propertyId={property.id} propertyName={property.name} />
          </div>
        </div>

        {/* KOLOM KANAN: KARTU AMANKAN KAMAR */}
        <div className="w-full lg:w-[380px] shrink-0">
          <PropertyStickyBottomBar
            property={property}
            selectedRoomType={selectedRoomType}
            formattedPrice={formattedPrice}
            isCheckingAuth={isCheckingAuth}
            onOpenBookingModal={handleOpenBookingModal}
            isOpeningChat={isOpeningChat}
            onOpenDirectChat={handleOpenDirectChat}
            existingVisit={existingVisit}
            onOpenVisitModal={() => setIsVisitModalOpen(true)}
          />
        </div>
      </div>

      {/* 2.5. REKOMENDASI KOS SERUPA */}
      <div id="section-similar-kos" className="mt-12 pt-10 border-t border-slate-200/80 dark:border-slate-800">
        <SimilarPropertiesSection
          currentPropertyId={property.id}
          propertyName={property.name}
          isFullyBooked={property.available_rooms === 0}
        />
      </div>

      {/* 4. BOOKING FORM MODAL */}
      <PropertyBookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBookingError(null);
          setDateValidationError(false);
        }}
        selectedRoomType={selectedRoomType}
        studentName={studentName}
        waNumber={waNumber}
        userAvatar={userAvatar}
        moveInDate={moveInDate}
        setMoveInDate={setMoveInDate}
        minDate={minDate}
        isSubmitting={isSubmitting}
        bookingError={bookingError}
        setBookingError={setBookingError}
        dateValidationError={dateValidationError}
        setDateValidationError={setDateValidationError}
        onSubmit={handleBookingSubmit}
        pendingBookingNotice={pendingBookingNotice}
        onClosePendingNotice={() =>
          setPendingBookingNotice({ isOpen: false, message: "" })
        }
      />

      {/* 6. MODAL JADWALKAN SURVEI */}
      <ScheduleVisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
        propertyAddress={property.address}
        existingVisit={existingVisit}
        onVisitCreated={(visit) => setExistingVisit(visit)}
      />
    </div>
  );
}
