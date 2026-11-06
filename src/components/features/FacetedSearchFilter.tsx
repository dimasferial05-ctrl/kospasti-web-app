"use client";

import React from "react";
import {
  Bath,
  DoorOpen,
  Wind,
  Fan,
  Wifi,
  Zap,
  ReceiptText,
  Car,
  Bike,
  Clock,
  PawPrint,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";

export interface FacilityFilterItem {
  id: string;
  label: string;
  queryValue: string;
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
}

export const POPULAR_FACILITIES: FacilityFilterItem[] = [
  {
    id: "kamar-mandi-dalam",
    label: "Kamar Mandi Dalam",
    queryValue: "Kamar Mandi Dalam",
    icon: Bath,
    popular: true,
  },
  {
    id: "ac",
    label: "AC",
    queryValue: "AC",
    icon: Wind,
    popular: true,
  },
  {
    id: "wifi",
    label: "WiFi Cepat",
    queryValue: "WiFi Cepat",
    icon: Wifi,
    popular: true,
  },
  {
    id: "parkir-mobil",
    label: "Parkir Mobil",
    queryValue: "Parkir Mobil",
    icon: Car,
    popular: true,
  },
  {
    id: "parkir-motor",
    label: "Parkir Motor",
    queryValue: "Parkir Motor",
    icon: Bike,
    popular: false,
  },
  {
    id: "akses-24-jam",
    label: "Bebas Jam Malam (24 Jam)",
    queryValue: "Bebas Jam Malam",
    icon: Clock,
    popular: true,
  },
  {
    id: "termasuk-listrik",
    label: "Termasuk Listrik",
    queryValue: "Termasuk Listrik",
    icon: Zap,
    popular: true,
  },
  {
    id: "token-sendiri",
    label: "Token Sendiri",
    queryValue: "Token Sendiri",
    icon: ReceiptText,
    popular: false,
  },
  {
    id: "kamar-mandi-luar",
    label: "Kamar Mandi Luar",
    queryValue: "Kamar Mandi Luar",
    icon: DoorOpen,
    popular: false,
  },
  {
    id: "kipas-angin",
    label: "Kipas Angin",
    queryValue: "Kipas Angin",
    icon: Fan,
    popular: false,
  },
  {
    id: "pet-friendly",
    label: "Boleh Bawa Hewan",
    queryValue: "Boleh Bawa Hewan",
    icon: PawPrint,
    popular: true,
  },
];

export interface FacetedSearchFilterProps {
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
  className?: string;
}

export function FacetedSearchFilter({
  selectedFacilities = [],
  onChange,
  className = "",
}: FacetedSearchFilterProps) {
  const [showAll, setShowAll] = React.useState(false);

  const toggleFacility = (value: string) => {
    const isSelected = selectedFacilities.includes(value);
    let next: string[];
    if (isSelected) {
      next = selectedFacilities.filter((item) => item !== value);
    } else {
      next = [...selectedFacilities, value];
    }
    onChange(next);
  };

  const handleReset = () => {
    onChange([]);
  };

  const activeCount = selectedFacilities.length;

  // Tampilkan fasilitas populer secara default, atau seluruh fasilitas jika tombol "Semua Fasilitas" diklik
  const displayedFacilities = showAll
    ? POPULAR_FACILITIES
    : POPULAR_FACILITIES.filter((f) => f.popular || selectedFacilities.includes(f.queryValue));

  return (
    <div
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-soft transition-all ${className}`}
      data-testid="faceted-search-filter"
    >
      {/* Header filter & counter */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">
              Filter Fasilitas Spesifik
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih fasilitas yang wajib tersedia di kamar kos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {activeCount} aktif
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline inline-flex items-center gap-1 transition-colors px-1 py-0.5 rounded cursor-pointer"
                title="Hapus semua filter fasilitas"
              >
                <span>Reset</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chips Container */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {displayedFacilities.map((fac) => {
          const Icon = fac.icon;
          const isSelected = selectedFacilities.includes(fac.queryValue);

          return (
            <button
              key={fac.id}
              type="button"
              onClick={() => toggleFacility(fac.queryValue)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-soft hover:bg-emerald-700 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
              <span>{fac.label}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </button>
          );
        })}

        {/* Toggle Lihat Semua / Ringkas */}
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-3 py-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        >
          {showAll ? "Tampilkan lebih sedikit" : `+ ${POPULAR_FACILITIES.length - displayedFacilities.length} fasilitas lainnya`}
        </button>
      </div>
    </div>
  );
}

export default FacetedSearchFilter;

