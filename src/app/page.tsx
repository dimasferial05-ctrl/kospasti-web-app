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
}

export default function Home() {
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
    <main className="max-w-7xl mx-auto min-h-screen relative w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
      {/* Hero Section: Google Search-like Experience */}
      <section className="relative w-full flex flex-col items-center justify-center text-center pt-8 pb-10 sm:pt-14 sm:pb-16 px-4">
        {/* Subtle background glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-gradient-to-tr from-emerald-100/40 via-teal-50/30 to-slate-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          Cari Kos Impianmu Lebih{" "}
          <span className="text-emerald-600">
            Mudah dan Instan
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-lg text-slate-600 max-w-xl leading-relaxed">
          Ketik kebutuhan kos Anda seperti lokasi terdekat, budget harga, atau fasilitas tertentu tanpa ribet atur filter manual.
        </p>

        {/* Smart Search Bar Container */}
        <div className="w-full max-w-2xl mt-8">
          <SmartSearchBar
            variant="hero"
            onSearch={handleSearch}
            placeholder='Ketik kebutuhan kos... contoh: "Kos putri dekat UI ada AC harga di bawah 2 juta"'
          />
        </div>

        {/* Quick Link to Map */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
          <span>Ingin melihat sebaran langsung di peta?</span>
          <Link
            href="/map"
            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Buka Peta Interaktif →</span>
          </Link>
        </div>
      </section>

      {/* Property List Section */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Rekomendasi Kos Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pilihan kamar kos terverifikasi dan siap huni di berbagai lokasi strategis.
            </p>
          </div>
          <Link
            href="/map"
            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline self-start sm:self-auto"
          >
            Lihat semua di peta →
          </Link>
        </div>

        {isLoading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Memuat rekomendasi kos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <SearchX className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Belum Ada Kos Tersedia
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Saat ini belum ada listing kos yang terdaftar di sistem.
            </p>
          </div>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/kos/${property.id}`}
                className="block h-full transition-transform duration-200 hover:scale-[1.02]"
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
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
