"use client";

import React, { useState, useEffect } from "react";
import { Home, User, Clock, ChevronLeft, ChevronRight, Star, MapPin } from "lucide-react";
import { WishlistButton } from "@/components/features/WishlistButton";

export interface RoomTypeItem {
  id?: string;
  name: string;
  price_per_month: number;
  availableRooms?: number;
  available_rooms?: number;
  facilities?: string | null;
  image_url?: string | null;
}

export interface KosPropertyCardProps {
  id?: string;
  name: string;
  price: number;
  availableRooms: number;
  genderType: string;
  facilities: string;
  imageUrl?: string | null;
  ownerName: string;
  lastUpdated: string;
  isPetFriendly?: boolean;
  is24Hours?: boolean;
  hasMultipleRoomTypes?: boolean;
  roomTypesCount?: number;
  roomTypes?: RoomTypeItem[];
  averageRating?: number;
  totalReviews?: number;
  isSaved?: boolean;
  distance?: number | null;
  distanceTargetName?: string | null;
  onWishlistToggle?: (isSaved: boolean) => void;
}

export function KosPropertyCard({
  id,
  name,
  price,
  availableRooms,
  genderType,
  facilities,
  imageUrl,
  ownerName,
  lastUpdated,
  isPetFriendly,
  is24Hours,
  hasMultipleRoomTypes,
  roomTypesCount,
  roomTypes,
  averageRating,
  isSaved = false,
  distance,
  distanceTargetName,
  onWishlistToggle,
}: KosPropertyCardProps) {
  const isMultiType =
    hasMultipleRoomTypes ||
    (roomTypesCount !== undefined && roomTypesCount > 1) ||
    (roomTypes !== undefined && roomTypes.length > 1);

  // Filter room types with valid image_url for slideshow cycle
  const slides = React.useMemo(() => {
    const list: Array<{ imageUrl: string; title: string; price: number }> = [];
    if (imageUrl) {
      list.push({ imageUrl, title: "Utama", price });
    }
    if (roomTypes && roomTypes.length > 0) {
      for (const rt of roomTypes) {
        if (rt.image_url && rt.image_url !== imageUrl && !list.some((s) => s.imageUrl === rt.image_url)) {
          list.push({
            imageUrl: rt.image_url,
            title: rt.name,
            price: rt.price_per_month,
          });
        }
      }
    }
    return list;
  }, [imageUrl, price, roomTypes]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle through room types images gracefully if there are multiple slides
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length, isHovered]);

  const currentSlide = slides[activeSlideIndex] || (imageUrl ? { imageUrl, title: "Utama", price } : null);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Format mata uang Rupiah
  const formattedPrice = isMultiType
    ? `Mulai Rp ${price.toLocaleString("id-ID")} / bln`
    : `Rp ${price.toLocaleString("id-ID")} / bulan`;

  // Format tanggal pembaruan
  const formattedDate = (() => {
    try {
      const date = new Date(lastUpdated);
      if (isNaN(date.getTime())) return lastUpdated;
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return lastUpdated;
    }
  })();

  // Lencana gender
  const normalizedGender = genderType?.toUpperCase() || "";
  const genderBadgeStyle = (() => {
    switch (normalizedGender) {
      case "PUTRA":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "PUTRI":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "CAMPUR":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  })();

  const isAvailable = availableRooms > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-soft overflow-hidden flex flex-col hover:shadow-lg hover:shadow-float hover:-translate-y-1 transition-all duration-300 h-full relative"
    >
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {slides.length > 0 ? (
          <>
            {slides.map((slide, idx) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={slide.imageUrl + idx}
                src={slide.imageUrl}
                alt={name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-110 transition-transform ${
                  idx === activeSlideIndex
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              />
            ))}

            {/* Room Type Tag when cycling */}
            {slides.length > 1 && currentSlide && currentSlide.title !== "Utama" && (
              <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/10 shadow-xs flex items-center gap-1.5 transition-all duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="truncate max-w-[150px]">{currentSlide.title}</span>
              </div>
            )}

            {/* Navigation Arrows on Hover (Airbnb style) */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Foto sebelumnya"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-soft hover:shadow-float hover:scale-105 active:scale-95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Foto berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 shadow-soft hover:shadow-float hover:scale-105 active:scale-95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Slide Dots Indicator */}
            {slides.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/40 backdrop-blur-xs px-2 py-1 rounded-full">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveSlideIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeSlideIndex
                        ? "w-3.5 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
            {/* Wishlist Button */}
            {id && (
              <div className="absolute top-3 right-3 z-20">
                <WishlistButton
                  propertyId={id}
                  initialIsSaved={isSaved}
                  onToggle={onWishlistToggle}
                  size="sm"
                  variant="floating"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 flex items-center justify-center text-slate-500">
              <Home className="w-5 h-5 stroke-[1.5]" />
            </div>
            <span className="text-xs font-medium text-slate-500">Foto belum tersedia</span>
            {id && (
              <div className="absolute top-3 right-3 z-20">
                <WishlistButton
                  propertyId={id}
                  initialIsSaved={isSaved}
                  onToggle={onWishlistToggle}
                  size="sm"
                  variant="floating"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2.5">
        {/* Header: Name, Rating & Gender Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {averageRating !== undefined && averageRating > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {averageRating.toFixed(1)}
              </span>
            )}
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${genderBadgeStyle}`}
            >
              {genderType}
            </span>
          </div>
        </div>

        {/* Price & Lifestyle Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formattedPrice}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {typeof distance === "number" && (
              <span
                className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200/80 dark:border-emerald-800 shadow-2xs"
                title={distanceTargetName ? `Jarak ${distance} km dari ${distanceTargetName}` : `Jarak ${distance} km ke lokasi tujuan`}
              >
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{distance} km{distanceTargetName ? ` dari ${distanceTargetName}` : ""}</span>
              </span>
            )}
            {is24Hours && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="Akses 24 Jam">
                24 Jam
              </span>
            )}
            {isPetFriendly && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800" title="Pet Friendly">
                Pet Friendly
              </span>
            )}
          </div>
        </div>

        {/* Facilities & Owner */}
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{ownerName}</span>
          </div>
          {facilities && (
            <p className="line-clamp-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              {facilities}
            </p>
          )}
        </div>

        {/* Footer: Availability & Last Updated */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAvailable ? (
              <span className="bg-green-100 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 dark:border-emerald-800">
                Sisa {availableRooms} Kamar
              </span>
            ) : (
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Penuh
              </span>
            )}
            {isMultiType && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {roomTypesCount ? `${roomTypesCount} Tipe` : "Multi Tipe"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KosPropertyCard;

