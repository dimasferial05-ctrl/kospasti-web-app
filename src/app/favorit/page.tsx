"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ArrowLeft,
  Sparkles,
  Loader2,
  LogIn,
  SlidersHorizontal,
  Building2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { KosPropertyCard } from "@/components/features/KosPropertyCard";

interface SavedPropertyItem {
  id: string;
  created_at: string;
  property: {
    id: string;
    name: string;
    price_per_month: number;
    available_rooms: number;
    gender_type: string;
    facilities: string;
    image_url?: string | null;
    is_pet_friendly?: boolean;
    is_24_hours?: boolean;
    address?: string | null;
    average_rating?: number;
    total_reviews?: number;
    updated_at: string;
    owner?: {
      id: string;
      name: string;
      whatsapp_number?: string;
    };
    room_types?: Array<{
      id: string;
      name: string;
      price_per_month: number;
      available_rooms: number;
      facilities?: string | null;
      image_url?: string | null;
    }>;
  };
}

export default function FavoritPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [savedItems, setSavedItems] = useState<SavedPropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;

    async function loadWishlist() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Cek status autentikasi pengguna
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json().catch(() => null);

        if (!isMounted) return;

        if (!authRes.ok || !authData?.authenticated) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // 2. Ambil daftar kos yang difavoritkan
        const wishlistRes = await fetch("/api/user/wishlist");
        const wishlistData = await wishlistRes.json().catch(() => null);

        if (!isMounted) return;

        if (wishlistRes.ok && wishlistData?.success && Array.isArray(wishlistData.savedProperties)) {
          setSavedItems(wishlistData.savedProperties);
        } else {
          setError(wishlistData?.error || "Gagal memuat daftar kos favorit.");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal memuat favorit:", err);
          setError("Terjadi kesalahan saat memuat data favorit.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleWishlistToggle = (propertyId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Hapus dari list tampilan secara responsif
      setSavedItems((prev) => prev.filter((item) => item.property.id !== propertyId));
    }
  };

  // Filter items berdasarkan query dan gender
  const filteredItems = useMemo(() => {
    return savedItems.filter((item) => {
      const property = item.property;
      if (!property) return false;

      const matchesSearch =
        searchQuery.trim() === "" ||
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.address && property.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (property.facilities && property.facilities.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGender =
        selectedGender === "ALL" ||
        property.gender_type.toUpperCase() === selectedGender.toUpperCase();

      return matchesSearch && matchesGender;
    });
  }, [savedItems, searchQuery, selectedGender]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[80vh] bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
            <div className="h-4 bg-slate-200 rounded-md w-72"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[80vh] bg-slate-50/50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-soft">
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-2xs">
            <Heart className="w-10 h-10 fill-rose-500/20 stroke-[1.8]" />
            <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk untuk Melihat Favorit
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Simpan daftar kos idaman Anda dan akses kembali kapan pun dengan mudah setelah masuk ke akun Anda.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent("/favorit")}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-soft transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Akun</span>
            </button>
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Jelajahi Kos</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="min-h-[80vh] bg-slate-50/50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-soft">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Gagal Memuat Favorit</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Empty Wishlist State
  if (savedItems.length === 0) {
    return (
      <div className="min-h-[80vh] bg-slate-50/50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-soft">
          <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-100 to-rose-50 border border-rose-200 flex items-center justify-center shadow-soft">
            <Heart className="w-12 h-12 text-rose-500 fill-rose-500/20 stroke-[1.8]" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1.5 rounded-full shadow-md">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Belum Ada Kos Favorit
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
              Anda belum menyimpan kos pilihan ke daftar favorit. Klik ikon hati pada listing kos yang Anda sukai untuk menyimpannya di sini.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-soft transition-all active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Jelajahi Kos Sekarang</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Populated Wishlist View
  return (
    <main className="min-h-screen bg-slate-50/50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kos Favorit Saya
              </h1>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {savedItems.length} Kos
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Daftar kos pilihan yang telah Anda simpan. Bandingkan dan hubungi pemilik dengan mudah.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 shadow-xs transition-all"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Cari Kos Lain</span>
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-soft transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4" />
              <span>Lihat di Peta</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari di favorit..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tipe:</span>
            </span>
            {[
              { id: "ALL", label: "Semua" },
              { id: "PUTRA", label: "Putra" },
              { id: "PUTRI", label: "Putri" },
              { id: "CAMPUR", label: "Campur" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedGender(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedGender === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Empty Results */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada kos favorit yang cocok dengan filter atau kata kunci Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGender("ALL");
              }}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(({ property }) => (
              <Link
                key={property.id}
                href={`/kos/${property.id}`}
                className="block h-full transition-transform hover:scale-[1.02]"
              >
                <KosPropertyCard
                  id={property.id}
                  name={property.name}
                  price={property.price_per_month}
                  availableRooms={property.available_rooms}
                  genderType={property.gender_type}
                  facilities={property.facilities}
                  imageUrl={property.image_url}
                  ownerName={property.owner?.name || "Pemilik Kos"}
                  lastUpdated={property.updated_at || new Date().toISOString()}
                  isPetFriendly={property.is_pet_friendly}
                  is24Hours={property.is_24_hours}
                  averageRating={property.average_rating}
                  totalReviews={property.total_reviews}
                  roomTypes={property.room_types}
                  roomTypesCount={property.room_types?.length}
                  isSaved={true}
                  onWishlistToggle={(isSaved) => handleWishlistToggle(property.id, isSaved)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
