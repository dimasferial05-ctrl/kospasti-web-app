"use client";

import React, { useState, useEffect } from "react";
import { Home, User, Clock, Sparkles } from "lucide-react";

export interface RoomTypeItem {
  id?: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  facilities?: string | null;
  image_url?: string | null;
}

export interface KosPropertyCardProps {
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
}

export function KosPropertyCard({
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

  // Auto-cycle through room types images every 3.5s if there are multiple slides
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [slides.length, isHovered]);

  const currentSlide = slides[activeSlideIndex] || (imageUrl ? { imageUrl, title: "Utama", price } : null);
  const displayedImageUrl = currentSlide ? currentSlide.imageUrl : imageUrl;

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
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PUTRI":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "CAMPUR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  })();

  const isAvailable = availableRooms > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1.5 transition-all duration-300 h-full relative"
    >
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100/90 flex items-center justify-center">
        {displayedImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={displayedImageUrl}
              src={displayedImageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ease-out animate-in fade-in zoom-in-95"
            />

            {/* Room Type Pill Indicator when cycling */}
            {slides.length > 1 && currentSlide && currentSlide.title !== "Utama" && (
              <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[140px]">{currentSlide.title}</span>
              </div>
            )}

            {/* Slide Dots Indicator */}
            {slides.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/40 backdrop-blur-xs px-2 py-1 rounded-full">
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
                        ? "w-4 bg-emerald-400"
                        : "w-1.5 bg-white/60 hover:bg-white"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/60 flex items-center justify-center text-slate-500">
              <Home className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">Foto belum tersedia</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header: Name & Gender Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors tracking-tight">
            {name}
          </h3>
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${genderBadgeStyle}`}
          >
            {genderType}
          </span>
        </div>

        {/* Price & Lifestyle Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 tracking-tight">
              {formattedPrice}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {is24Hours && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200" title="Akses 24 Jam / Bebas Jam Malam">
                24 Jam
              </span>
            )}
            {isPetFriendly && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" title="Boleh membawa hewan peliharaan">
                🐾 Pet Friendly
              </span>
            )}
          </div>
        </div>

        {/* Additional Info: Owner & Facilities with extra breathing room */}
        <div className="space-y-1.5 text-xs text-slate-600 py-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-slate-500" />
            </div>
            <span className="font-medium text-slate-700 truncate">{ownerName}</span>
          </div>
          {facilities && (
            <p className="line-clamp-1 text-slate-600 text-[11px] pl-0.5">
              {facilities}
            </p>
          )}
        </div>

        {/* Footer: Availability Badge & Last Updated */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Availability Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAvailable ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200/60 shadow-xs">
                Sisa {availableRooms} Kamar
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                Penuh
              </span>
            )}
            {isMultiType && (
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                {roomTypesCount ? `${roomTypesCount} Tipe` : "Multi Tipe"}
              </span>
            )}
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 shrink-0">
            <Clock className="w-3 h-3" />
            <span>Diperbarui: {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KosPropertyCard;

