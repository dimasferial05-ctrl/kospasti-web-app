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
    <div className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1.5 transition-all duration-300 h-full relative">
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100/90 flex items-center justify-center">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ease-out"
          />
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
          {isAvailable ? (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200/60 shadow-xs">
              Sisa {availableRooms} Kamar
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
              Penuh
            </span>
          )}

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

