"use client";

import React, { useState, useEffect } from "react";
import { Home, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { WishlistButton } from "@/components/features/WishlistButton";

export interface RoomTypeItem {
  id?: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
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
  isSaved?: boolean;
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
  isSaved = false,
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
  const displayedImageUrl = currentSlide ? currentSlide.imageUrl : imageUrl;

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
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 h-full relative"
    >
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
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
              <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md border border-white/10 shadow-xs flex items-center gap-1.5 transition-all duration-300">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Foto berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
        {/* Header: Name & Gender Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors tracking-tight">
            {name}
          </h3>
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold border shrink-0 ${genderBadgeStyle}`}
          >
            {genderType}
          </span>
        </div>

        {/* Price & Lifestyle Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-bold text-emerald-600 tracking-tight">
            {formattedPrice}
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {is24Hours && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200" title="Akses 24 Jam">
                24 Jam
              </span>
            )}
            {isPetFriendly && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80" title="Pet Friendly">
                Pet Friendly
              </span>
            )}
          </div>
        </div>

        {/* Facilities & Owner */}
        <div className="space-y-1 text-xs text-slate-500 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700 truncate">{ownerName}</span>
          </div>
          {facilities && (
            <p className="line-clamp-1 text-slate-500 text-[11px]">
              {facilities}
            </p>
          )}
        </div>

        {/* Footer: Availability & Last Updated */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAvailable ? (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">
                Sisa {availableRooms} Kamar
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Penuh
              </span>
            )}
            {isMultiType && (
              <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                {roomTypesCount ? `${roomTypesCount} Tipe` : "Multi Tipe"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KosPropertyCard;

