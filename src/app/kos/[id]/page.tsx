"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import PropertyLocationMap from "@/components/map/PropertyLocationMap";

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
  updated_at?: string;
  owner?: {
    name: string;
    whatsapp_number: string;
  };
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeIndex, setActiveIndex] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [waNumber, setWaNumber] = useState("");
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
    // 1. Validasi Tanggal Masuk
    if (!moveInDate) {
      alert("Mohon pilih rencana tanggal masuk Anda.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Panggil API Booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id, // id diambil dari parameter URL
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

      // 3. Cek Status Respons
      if (!response.ok) {
        throw new Error(responseData.error || "Gagal melakukan pemesanan.");
      }

      // 4. Redirect ke Halaman Checkout QRIS
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
    // Scroll ke paling atas saat halaman dimuat
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    // Mendapatkan format YYYY-MM-DD hari ini di sisi client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(new Date().toISOString().split("T")[0]);
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPropertyDetail() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${id}`);
        const json = await res.json();
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Memuat detail kamar...</p>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const mediaList: PropertyMediaItem[] = (() => {
    const list: PropertyMediaItem[] = [];
    if (property.media && property.media.length > 0) {
      list.push(...property.media);
    }
    if (property.image_url && !list.some((m) => m.url === property.image_url)) {
      list.unshift({ url: property.image_url, type: "IMAGE" });
    }
    if (property.room_types && property.room_types.length > 0) {
      for (const rt of property.room_types) {
        if (rt.image_url && !list.some((m) => m.url === rt.image_url)) {
          list.push({ url: rt.image_url, type: "IMAGE" });
        }
      }
    }
    return list;
  })();

  const handleSelectRoomType = (rt: RoomTypeItem) => {
    setSelectedRoomType(rt);
    if (rt.image_url) {
      const foundIdx = mediaList.findIndex((m) => m.url === rt.image_url);
      if (foundIdx >= 0) {
        setActiveIndex(foundIdx);
      }
    }
  };

  const prevSlide = () => {
    if (mediaList.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (mediaList.length <= 1) return;
    setActiveIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = mediaList[activeIndex] || null;

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

  const facilitiesList = property.facilities
    ? property.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
      : [];

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-slate-50 pb-24 lg:pb-12 px-0 lg:px-8 flex flex-col relative shadow-sm">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-bold text-slate-800 truncate">
            Detail Kos
          </h1>
        </div>
      </div>

      {/* Split-View Container */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:mt-8">
        {/* KOLOM KIRI (Galeri & Info Kos) */}
        <div className="flex-1 flex flex-col w-full">
          {/* Galeri / Carousel Media */}
          <div className="w-full flex flex-col bg-slate-900 lg:rounded-2xl overflow-hidden">
            {/* Main Viewer (Penampil Utama) */}
            <div className="w-full h-72 lg:h-96 relative bg-slate-200 overflow-hidden flex items-center justify-center group">
              {currentMedia ? (
                currentMedia.type === "VIDEO" ? (
                  <video
                    key={currentMedia.url}
                    src={currentMedia.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentMedia.url}
                    alt={`${property.name} - ${activeIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Home className="w-12 h-12 stroke-[1.5]" />
                  <span className="text-xs">Tidak ada foto</span>
                </div>
              )}

              {/* Tombol Navigasi Kiri / Kanan */}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Media sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Media berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer z-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Counter badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold rounded-full flex items-center gap-1.5 z-20">
                    {currentMedia?.type === "VIDEO" ? (
                      <Play className="w-3 h-3 fill-white text-white" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <span>
                      {activeIndex + 1} / {mediaList.length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails Bar (Pilihan di Bawah Penampil Utama) */}
            {mediaList.length > 1 && (
              <div className="bg-slate-900/90 border-t border-slate-800 p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {mediaList.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Lihat media ${idx + 1}`}
                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activeIndex === idx
                        ? "border-blue-500 ring-2 ring-blue-500/50 opacity-100 scale-100"
                        : "border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {item.type === "VIDEO" ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white relative">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body Section */}
          <div className="flex flex-col gap-4 p-4 lg:px-0 lg:py-6">
            {/* Informasi Dasar */}
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
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {property.name}
                </h2>
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

            {/* Pilihan Tipe Kamar */}
            {property.room_types && property.room_types.length > 0 && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h3 className="text-base font-bold text-slate-900">Pilihan Tipe Kamar</h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {property.room_types.length} Tipe Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {property.room_types.map((rt) => {
                    const isSelected = selectedRoomType?.id === rt.id;
                    const isRoomAvailable = rt.available_rooms > 0;
                    const roomFacilitiesList = rt.facilities
                      ? rt.facilities.split(",").map((f) => f.trim()).filter(Boolean)
                      : [];

                    return (
                      <div
                        key={rt.id}
                        onClick={() => handleSelectRoomType(rt)}
                        className={`group p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Thumbnail & Title/Facilities */}
                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                          {rt.image_url ? (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/80 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={rt.image_url}
                                alt={rt.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 text-slate-400">
                              <Home className="w-6 h-6 stroke-[1.5]" />
                            </div>
                          )}

                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
                                {rt.name}
                              </span>
                              {isRoomAvailable ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                                  Sisa {rt.available_rooms} Kamar
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  Penuh
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                  ✓ Dipilih
                                </span>
                              )}
                            </div>

                            {roomFacilitiesList.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {roomFacilitiesList.map((fac, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md"
                                  >
                                    {fac}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Harga Kamar</p>
                            <p className="text-base sm:text-lg font-black text-emerald-600">
                              Rp {rt.price_per_month.toLocaleString("id-ID")}
                              <span className="text-[11px] font-normal text-slate-500"> /bln</span>
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
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              !isRoomAvailable
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200"
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

            {/* Fasilitas & Deskripsi */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className="text-base font-bold text-slate-900">Fasilitas Bersama &amp; Bangunan</h3>
              </div>

              {facilitiesList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {facilitiesList.map((facility, idx) => (
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
                  {property.facilities || "Tidak ada rincian fasilitas"}
                </p>
              )}

              {/* Aturan & Kebijakan Kos */}
              <div className="mt-2 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Aturan &amp; Kebijakan
                </h4>
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
                        {property.is_24_hours
                          ? "Akses 24 Jam"
                          : "Ada Jam Malam"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {property.is_24_hours
                          ? "Bebas keluar masuk tanpa jam malam"
                          : "Gerbang dikunci pada jam tertentu"}
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
                        {property.is_pet_friendly
                          ? "Boleh Bawa Hewan"
                          : "Dilarang Bawa Hewan"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {property.is_pet_friendly
                          ? "Hewan peliharaan (kucing/anjing) diizinkan"
                          : "Tidak diperkenankan membawa peliharaan"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {property.description && (
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Deskripsi
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                    {property.description}
                  </p>
                </div>
              )}
            </div>

            {/* Lokasi & Rute Google Maps */}
            <PropertyLocationMap
              propertyName={property.name}
              address={property.address}
              latitude={property.latitude}
              longitude={property.longitude}
            />

            {/* Info Pemilik */}
            <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-soft flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Dikelola oleh</p>
                  <p className="text-sm font-bold text-slate-900">
                    {property.owner?.name || "Pemilik Kos"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (Kartu Booking Sticky) */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex justify-between items-center z-50 lg:static lg:block lg:p-6 lg:border lg:rounded-2xl lg:shadow-md lg:sticky lg:top-24">
            {/* Inner Container */}
            <div className="max-w-md mx-auto lg:max-w-none w-full flex justify-between lg:flex-col lg:gap-4 items-center lg:items-start">
              <div className="lg:w-full">
                <p className="text-[10px] lg:text-sm text-slate-400 font-medium">
                  {selectedRoomType ? `Harga (${selectedRoomType.name})` : "Harga per bulan"}
                </p>
                <p className="text-base lg:text-2xl font-bold text-slate-900">
                  {formattedPrice}{" "}
                  <span className="text-xs lg:text-sm font-normal text-slate-500">
                    / bln
                  </span>
                </p>
                {isFull && (
                  <p className="text-[10px] lg:text-sm text-rose-500 font-medium mt-1">
                    Mohon maaf, tipe kamar ini telah penuh.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isFull || isCheckingAuth}
                onClick={() => handleOpenBookingModal()}
                className={`px-6 py-2 lg:py-3 lg:w-full rounded-lg font-bold text-white transition-all duration-200 ${
                  isFull || isCheckingAuth
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 cursor-pointer"
                }`}
              >
                {isFull
                  ? "Kamar Penuh"
                  : isCheckingAuth
                  ? "Memeriksa..."
                  : "Amankan Kamar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
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
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
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
