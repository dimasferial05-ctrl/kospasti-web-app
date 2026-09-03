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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="h-48 w-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
            <Home className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header: Name & Gender Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
            {name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium border shrink-0 ${genderBadgeStyle}`}
          >
            {genderType}
          </span>
        </div>

        {/* Price */}
        <div>
          <span className="text-base sm:text-lg font-bold text-blue-600">
            {formattedPrice}
          </span>
        </div>

        {/* Additional Info: Owner & Facilities */}
        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ownerName}</span>
          </div>
          {facilities && (
            <p className="line-clamp-1 text-slate-500">
              {facilities}
            </p>
          )}
        </div>

        {/* Footer: Availability Badge & Last Updated */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Availability Badge */}
          {isAvailable ? (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Sisa {availableRooms} Kamar
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
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
