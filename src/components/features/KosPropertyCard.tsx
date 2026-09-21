import React from "react";
import { Home, User, Clock } from "lucide-react";

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
}: KosPropertyCardProps) {
  // Format mata uang Rupiah
  const formattedPrice = `Rp ${price.toLocaleString("id-ID")} / bulan`;

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
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 h-full">
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
            <Home className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Header: Name & Gender Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium border shrink-0 ${genderBadgeStyle}`}
          >
            {genderType}
          </span>
        </div>

        {/* Price & Lifestyle Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-emerald-600 tracking-tight">
              Rp {price.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-400 font-normal">/ bulan</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {is24Hours && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80" title="Akses 24 Jam / Bebas Jam Malam">
                Akses 24 Jam
              </span>
            )}
            {isPetFriendly && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80" title="Boleh membawa hewan peliharaan">
                Pet Friendly
              </span>
            )}
          </div>
        </div>

        {/* Additional Info: Owner & Facilities with extra breathing room */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ownerName}</span>
          </div>
          {facilities && (
            <p className="line-clamp-1 text-slate-500 pt-0.5">
              {facilities}
            </p>
          )}
        </div>

        {/* Footer: Availability Badge & Last Updated */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Availability Badge */}
          {isAvailable ? (
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200/60">
              Sisa {availableRooms} Kamar
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full">
              Penuh
            </span>
          )}

          {/* Last Updated */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>Diperbarui: {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KosPropertyCard;
