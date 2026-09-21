"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KosPropertyCard } from "@/components/features/KosPropertyCard";
import { SmartSearchBar } from "@/components/features/SmartSearchBar";
import { Loader2, AlertCircle, SearchX, MapPin } from "lucide-react";

interface PropertyItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  last_updated: string;
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

export default function SearchPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      try {
        const res = await fetch("/api/properties");
        const json = await res.json();

        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            setProperties(json.data);
          } else {
            setError(json.error || "Gagal mengambil data properti");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch properties error:", err);
          setError("Terjadi kesalahan saat memuat data kos");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (prompt: string) => {
    if (prompt.trim()) {
      router.push(`/map?q=${encodeURIComponent(prompt.trim())}`);
    }
  };

  return (
    <main className="max-w-7xl mx-auto min-h-screen relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14">
      {/* Search Header Section */}
      <section className="relative w-full flex flex-col items-center justify-center text-center pt-6 pb-8 sm:pt-10 sm:pb-12 px-4">
        {/* Subtle Brand Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span>Pencarian Kos Cepat &amp; Akurat</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          Cari Kos Sesuai{" "}
          <span className="text-emerald-600">
            Kebutuhanmu
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
          Temukan info kos dengan fasilitas lengkap, harga transparan, dan ketersediaan kamar terupdate secara real-time.
        </p>

        {/* Smart Search Bar Container */}
        <div className="w-full max-w-2xl mt-7">
          <SmartSearchBar
            variant="hero"
            onSearch={handleSearch}
            placeholder='Ketik kebutuhan kos... contoh: "Kos putri dekat UI ada AC harga di bawah 2 juta"'
          />
        </div>

        {/* Quick Link to Map */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
          <span>Ingin melihat sebaran kos di peta?</span>
          <Link
            href="/map"
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buka Peta Interaktif →</span>
          </Link>
        </div>
      </section>

      {/* Property List Section */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Rekomendasi Kos Terbaru
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pilihan kamar kos terverifikasi dan siap huni di berbagai lokasi strategis.
            </p>
          </div>
          <Link
            href="/map"
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat semua di peta</span>
            <span>→</span>
          </Link>
        </div>

        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold text-slate-600">Memuat daftar kos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 flex items-center gap-2.5 text-sm shadow-2xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center p-14 text-center bg-white rounded-3xl border border-slate-200 border-dashed shadow-soft">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Kos Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Maaf, tidak ada kos yang sesuai dengan kriteria pencarian atau filter Anda. Saat ini belum ada listing kos yang terdaftar di sistem.
            </p>
          </div>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/kos/${property.id}`}
                className="block h-full transition-transform hover:scale-[1.02]"
              >
                <KosPropertyCard
                  name={property.name}
                  price={property.price_per_month}
                  availableRooms={property.available_rooms}
                  genderType={property.gender_type}
                  facilities={property.facilities}
                  imageUrl={property.image_url}
                  ownerName={property.owner?.name || "Pemilik Kos"}
                  lastUpdated={
                    property.last_updated ||
                    property.updated_at ||
                    new Date().toISOString()
                  }
                  isPetFriendly={property.is_pet_friendly}
                  is24Hours={property.is_24_hours}
                  roomTypes={property.room_types}
                  roomTypesCount={property.room_types?.length}
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
