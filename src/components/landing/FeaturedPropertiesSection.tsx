"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import { KosPropertyCard } from "@/components/features/KosPropertyCard";
import { KosPropertyCardSkeleton } from "@/components/features/KosPropertyCardSkeleton";

interface PropertyItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  address?: string | null;
  image_url?: string | null;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  is_featured?: boolean;
  average_rating?: number;
  total_reviews?: number;
  last_updated?: string;
  updated_at?: string;
  owner?: {
    name: string;
  };
  room_types?: Array<{
    id: string;
    name: string;
    price_per_month: number;
    available_rooms: number;
    facilities?: string | null;
    image_url?: string | null;
  }>;
}

export function FeaturedPropertiesSection() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      try {
        const [resProp, resWishlist] = await Promise.all([
          fetch("/api/properties?featured=true&limit=6"),
          fetch("/api/user/wishlist?idsOnly=true").catch(() => null),
        ]);

        if (resProp.ok) {
          const json = await resProp.json();
          if (isMounted && json.success && Array.isArray(json.data)) {
            setProperties(json.data);
          }
        }

        if (resWishlist && resWishlist.ok) {
          const wishlistJson = await resWishlist.json().catch(() => null);
          if (isMounted && wishlistJson?.success && Array.isArray(wishlistJson.savedIds)) {
            setSavedPropertyIds(new Set(wishlistJson.savedIds));
          }
        }
      } catch (err) {
        console.error("Gagal memuat kos rekomendasi di beranda:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  // Jika setelah loading selesai dan tidak ada kos featured, sembunyikan section agar tidak kosong
  if (!isLoading && properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
              <span>Pilihan Terverifikasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kos Rekomendasi Pilihan KosPasti
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              Pilihan hunian sewa terfavorit dengan fasilitas lengkap, reputasi terpercaya, dan kepastian kamar real-time.
            </p>
          </div>

          <Link
            href="/search?featured=true"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors shrink-0 group self-start sm:self-auto"
          >
            <span>Lihat Semua Rekomendasi</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <KosPropertyCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <KosPropertyCard
                key={property.id}
                id={property.id}
                name={property.name}
                price={property.price_per_month}
                availableRooms={property.available_rooms}
                genderType={property.gender_type}
                facilities={property.facilities}
                imageUrl={property.image_url}
                ownerName={property.owner?.name || "Pemilik Kos"}
                isPetFriendly={property.is_pet_friendly}
                is24Hours={property.is_24_hours}
                isFeatured={property.is_featured ?? true}
                averageRating={property.average_rating}
                totalReviews={property.total_reviews}
                lastUpdated={property.updated_at || property.last_updated || new Date().toISOString()}
                isSaved={savedPropertyIds.has(property.id)}
                roomTypes={property.room_types}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedPropertiesSection;
