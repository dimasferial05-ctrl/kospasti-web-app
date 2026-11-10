"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import KosPropertyCard from "@/components/features/KosPropertyCard";
import { KosPropertyCardSkeleton } from "@/components/features/KosPropertyCardSkeleton";

export interface SimilarPropertyItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  last_updated: string;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  average_rating?: number;
  total_reviews?: number;
  distance_km?: number | null;
  owner?: {
    name?: string | null;
    whatsapp_number?: string | null;
    avatar_url?: string | null;
  } | null;
  room_types?: Array<{
    id?: string;
    name: string;
    price_per_month: number;
    available_rooms?: number;
    facilities?: string | null;
    image_url?: string | null;
  }>;
}

interface SimilarPropertiesSectionProps {
  currentPropertyId: string;
  propertyName: string;
  isFullyBooked?: boolean;
  className?: string;
}

export function SimilarPropertiesSection({
  currentPropertyId,
  propertyName,
  isFullyBooked = false,
  className = "",
}: SimilarPropertiesSectionProps) {
  const [properties, setProperties] = useState<SimilarPropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSimilar() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/properties/${currentPropertyId}/similar?limit=3`);
        const json = await res.json();

        if (isMounted) {
          if (res.ok && json.success && Array.isArray(json.data)) {
            setProperties(json.data);
          } else {
            setError(json.error || "Gagal memuat kos serupa");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Gagal mengambil data rekomendasi kos serupa:", err);
          setError("Gagal memuat rekomendasi kos serupa");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (currentPropertyId) {
      fetchSimilar();
    }

    return () => {
      isMounted = false;
    };
  }, [currentPropertyId]);

  if (!isLoading && properties.length === 0) {
    return null;
  }

  return (
    <section
      className={`space-y-6 ${className}`}
      data-testid="similar-properties-section"
      aria-label="Rekomendasi Kos Serupa"
    >
      {/* Banner Peringatan Kamar Penuh */}
      {isFullyBooked && (
        <div
          data-testid="fully-booked-banner"
          className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start sm:items-center gap-3.5 shadow-2xs animate-fadeIn"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
              Kamar di {propertyName} Saat Ini Sedang Penuh
            </h4>
            <p className="text-xs font-medium text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              Jangan khawatir! Berikut adalah beberapa alternatif kos terdekat dengan tipe gender dan rentang harga serupa yang kamarnya masih tersedia.
            </p>
          </div>
        </div>
      )}

      {/* Header Bagian */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rekomendasi Pilihan</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Kos Serupa di Sekitar Area Ini
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Alternatif kos dengan gender dan rentang harga serupa di sekitar properti ini.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group self-start sm:self-auto"
        >
          <span>Lihat Semua Kos di Wilayah Ini</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid Konten */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <KosPropertyCardSkeleton />
          <KosPropertyCardSkeleton />
          <KosPropertyCardSkeleton />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {properties.map((item) => (
            <KosPropertyCard
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price_per_month}
              availableRooms={item.available_rooms}
              genderType={item.gender_type}
              facilities={item.facilities}
              imageUrl={item.image_url}
              ownerName={item.owner?.name || "Pemilik Kos"}
              lastUpdated={item.last_updated}
              isPetFriendly={item.is_pet_friendly}
              is24Hours={item.is_24_hours}
              averageRating={item.average_rating}
              totalReviews={item.total_reviews}
              distance={item.distance_km}
              distanceTargetName="kos ini"
              roomTypes={item.room_types}
              roomTypesCount={item.room_types?.length}
              hasMultipleRoomTypes={Boolean(item.room_types && item.room_types.length > 1)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default SimilarPropertiesSection;
