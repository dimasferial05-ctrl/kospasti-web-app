"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  ArrowLeft,
  X,
  Check,
  Star,
  MapPin,
  Clock,
  Zap,
  ShieldAlert,
  Plus,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { useCompare, MAX_COMPARE_ITEMS } from "@/hooks/useCompare";
import { ComparePropertyData } from "@/app/api/properties/compare/route";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIds = searchParams.get("ids");

  const { compareList, removeFromCompare, clearCompare, isLoaded } = useCompare();

  const [properties, setProperties] = useState<ComparePropertyData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(false);

  // Tentukan daftar ID kos yang akan dimuat
  const targetIds = useMemo(() => {
    if (queryIds && queryIds.trim()) {
      return queryIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_ITEMS);
    }
    if (isLoaded && compareList.length > 0) {
      return compareList.map((item) => item.id).slice(0, MAX_COMPARE_ITEMS);
    }
    return [];
  }, [queryIds, isLoaded, compareList]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCompareData() {
      if (targetIds.length === 0) {
        setProperties([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/properties/compare?ids=${targetIds.join(",")}`);
        const json = await res.json();

        if (isMounted) {
          if (res.ok && json.success && Array.isArray(json.data)) {
            setProperties(json.data);
          } else {
            setError(json.error || "Gagal memuat data komparasi");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching compare data:", err);
          setError("Terjadi kesalahan jaringan saat memuat komparasi");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCompareData();

    return () => {
      isMounted = false;
    };
  }, [targetIds]);

  const handleRemove = (id: string) => {
    removeFromCompare(id);
    const remaining = properties.filter((p) => p.id !== id);
    setProperties(remaining);

    // Update query string URL agar tetap sinkron
    if (remaining.length > 0) {
      const nextQuery = remaining.map((p) => p.id).join(",");
      router.replace(`/compare?ids=${nextQuery}`);
    } else {
      router.replace("/compare");
    }
  };

  const handleClearAll = () => {
    clearCompare();
    setProperties([]);
    router.replace("/compare");
  };

  // Status Perbedaan untuk setiap baris fitur
  const diffStatus = useMemo(() => {
    if (properties.length < 2) return {} as Record<string, boolean>;

    const isDifferent = (getter: (p: ComparePropertyData) => unknown) => {
      const first = getter(properties[0]);
      return properties.some((p) => getter(p) !== first);
    };

    return {
      gender: isDifferent((p) => p.gender_type),
      price: isDifferent((p) => p.price_per_month),
      rooms: isDifferent((p) => p.available_rooms > 0),
      ac: isDifferent((p) => p.structured_features.has_ac),
      wifi: isDifferent((p) => p.structured_features.has_wifi),
      km: isDifferent((p) => p.structured_features.has_private_bathroom),
      bed: isDifferent((p) => p.structured_features.has_bed),
      wardrobe: isDifferent((p) => p.structured_features.has_wardrobe),
      desk: isDifferent((p) => p.structured_features.has_study_desk),
      kitchen: isDifferent((p) => p.structured_features.has_shared_kitchen),
      fridge: isDifferent((p) => p.structured_features.has_refrigerator),
      parking_motor: isDifferent((p) => p.structured_features.has_motorcycle_parking),
      parking_car: isDifferent((p) => p.structured_features.has_car_parking),
      laundry: isDifferent((p) => p.structured_features.has_laundry),
      hours24: isDifferent((p) => p.is_24_hours),
      electricity: isDifferent((p) => p.structured_features.is_electricity_included),
      curfew: isDifferent((p) => p.structured_features.has_curfew),
      pet: isDifferent((p) => p.is_pet_friendly),
    };
  }, [properties]);

  const rowBgClass = (key: string) => {
    if (highlightDiffs && diffStatus[key]) {
      return "bg-amber-50/70 dark:bg-amber-950/20";
    }
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Komparasi Kos</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                {properties.length} dari 3 Kos
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Bandingkan harga, fasilitas, aturan, dan lokasi kampus secara berdampingan untuk keputusan terbaik.
          </p>
        </div>

        {properties.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {properties.length >= 2 && (
              <button
                type="button"
                onClick={() => setHighlightDiffs(!highlightDiffs)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  highlightDiffs
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{highlightDiffs ? "Perbedaan Disorot" : "Sorot Perbedaan"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        )}
      </div>

      {/* Konten Utama: Loading / Empty / Tabel */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Memuat perbandingan kos pilihan Anda...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-center space-y-3">
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-rose-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      ) : properties.length === 0 ? (
        /* Empty State */
        <div
          data-testid="compare-empty-state"
          className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
            <Scale className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Belum Ada Kos untuk Dibandingkan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Pilih hingga 3 kos dengan menekan tombol perbandingan di kartu pencarian kos atau halaman detail kos.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/search"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-soft hover:shadow-float transition-all inline-flex items-center gap-2"
            >
              <span>Jelajahi Kos Sekarang</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Tabel Perbandingan Berdampingan */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* Table Header: Kartu Ringkasan Properti */}
              <thead>
                <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="p-4 sm:p-5 w-48 sm:w-56 align-top font-bold text-xs text-slate-400 uppercase tracking-wider sticky left-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md">
                    Properti Kos
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="p-4 sm:p-5 w-72 sm:w-80 align-top">
                      <div className="flex flex-col gap-3 relative">
                        {/* Tombol Hapus dari Kolom */}
                        <button
                          type="button"
                          onClick={() => handleRemove(property.id)}
                          aria-label={`Hapus ${property.name} dari perbandingan`}
                          title="Hapus dari perbandingan"
                          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 transition-colors flex items-center justify-center cursor-pointer z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Foto & Thumbnail */}
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                          {property.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={property.image_url}
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                              Tidak Ada Foto
                            </div>
                          )}
                          <span
                            className={`absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                              property.gender_type.toLowerCase() === "putri"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : property.gender_type.toLowerCase() === "putra"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {property.gender_type}
                          </span>
                        </div>

                        {/* Nama & Rating */}
                        <div>
                          <Link
                            href={`/kos/${property.id}`}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 tracking-tight"
                          >
                            {property.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            {property.average_rating > 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>{property.average_rating.toFixed(1)}</span>
                                <span className="text-slate-400">({property.total_reviews} ulasan)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Belum ada ulasan</span>
                            )}
                          </div>
                        </div>

                        {/* Harga & CTA */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                              Mulai Dari
                            </span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                              Rp {property.price_per_month.toLocaleString("id-ID")}
                              <span className="text-[11px] font-normal text-slate-400"> /bln</span>
                            </span>
                          </div>
                          <Link
                            href={`/kos/${property.id}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-2xs shrink-0"
                          >
                            Lihat Kos
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Slot Tambah Kos (Jika < 3) */}
                  {properties.length < MAX_COMPARE_ITEMS && (
                    <th className="p-4 sm:p-5 w-72 sm:w-80 align-middle">
                      <Link
                        href="/search"
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2.5 transition-colors group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 text-slate-500 group-hover:text-emerald-600 transition-colors flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">
                            Tambah Kos Lain
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Bandingkan hingga {MAX_COMPARE_ITEMS} kos
                          </p>
                        </div>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Table Body: Perbandingan Baris Parameter */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {/* 1. SEKSI IDENTITAS & KAMAR */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/60">
                  <td
                    colSpan={properties.length + (properties.length < 3 ? 2 : 1)}
                    className="py-2.5 px-4 sm:px-5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    1. Ketersediaan &amp; Tipe Kos
                  </td>
                </tr>

                <tr className={rowBgClass("gender")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Tipe Gender
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 font-semibold text-slate-800 dark:text-slate-200">
                      {p.gender_type}
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("rooms")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Sisa Kamar
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      {p.available_rooms > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-xs">
                          <Check className="w-3 h-3" />
                          <span>Tersedia {p.available_rooms} Kamar</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full text-xs">
                          <X className="w-3 h-3" />
                          <span>Kamar Penuh</span>
                        </span>
                      )}
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                {/* 2. SEKSI KAMPUS & LOKASI */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/60">
                  <td
                    colSpan={properties.length + (properties.length < 3 ? 2 : 1)}
                    className="py-2.5 px-4 sm:px-5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    2. Lokasi &amp; Jarak ke Kampus
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Kampus Terdekat
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      {p.nearest_campus ? (
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{p.nearest_campus.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span>{p.nearest_campus.distance_km} km</span>
                            <span className="mx-1">•</span>
                            <span>{p.nearest_campus.walk_minutes} mnt jalan kaki</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {p.address || "Area Subang"}
                        </span>
                      )}
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                {/* 3. SEKSI FASILITAS KAMAR */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/60">
                  <td
                    colSpan={properties.length + (properties.length < 3 ? 2 : 1)}
                    className="py-2.5 px-4 sm:px-5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    3. Fasilitas Kamar
                  </td>
                </tr>

                <tr className={rowBgClass("km")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Kamar Mandi
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_private_bathroom}
                        trueText="Kamar Mandi Dalam"
                        falseText="Kamar Mandi Luar"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("ac")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Pendingin Ruangan
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_ac}
                        trueText="AC"
                        falseText="Kipas Angin / Ventilasi"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("wifi")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Internet / WiFi
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_wifi}
                        trueText="WiFi Termasuk"
                        falseText="Tidak Ada WiFi"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("bed")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Kasur / Tempat Tidur
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_bed}
                        trueText="Tersedia Kasur"
                        falseText="Kamar Kosongan"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("wardrobe")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Lemari Pakaian
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_wardrobe}
                        trueText="Ada Lemari"
                        falseText="Tanpa Lemari"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("desk")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Meja &amp; Kursi Belajar
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_study_desk}
                        trueText="Ada Meja Belajar"
                        falseText="Tanpa Meja Belajar"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                {/* 4. SEKSI FASILITAS BERSAMA */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/60">
                  <td
                    colSpan={properties.length + (properties.length < 3 ? 2 : 1)}
                    className="py-2.5 px-4 sm:px-5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    4. Fasilitas Bersama
                  </td>
                </tr>

                <tr className={rowBgClass("kitchen")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Dapur Bersama
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_shared_kitchen}
                        trueText="Ada Dapur Bersama"
                        falseText="Tidak Ada Dapur"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("fridge")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Kulkas Bersama
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_refrigerator}
                        trueText="Ada Kulkas"
                        falseText="Tidak Ada Kulkas"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("parking_motor")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Parkir Motor
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_motorcycle_parking}
                        trueText="Ada Parkir Motor"
                        falseText="Tidak Ada Parkir"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("parking_car")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Parkir Mobil
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.structured_features.has_car_parking}
                        trueText="Ada Parkir Mobil"
                        falseText="Tidak Bisa Mobil"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                {/* 5. SEKSI ATURAN & LISTRIK */}
                <tr className="bg-slate-100/60 dark:bg-slate-800/60">
                  <td
                    colSpan={properties.length + (properties.length < 3 ? 2 : 1)}
                    className="py-2.5 px-4 sm:px-5 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    5. Aturan &amp; Ketentuan
                  </td>
                </tr>

                <tr className={rowBgClass("hours24")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Akses 24 Jam
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.is_24_hours}
                        trueText="Bebas 24 Jam"
                        falseText="Ada Jam Malam"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("electricity")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Biaya Listrik
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5 font-semibold text-slate-800 dark:text-slate-200">
                      {p.structured_features.is_electricity_included ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Sudah Termasuk Listrik</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">
                          Token Mandiri / Bayar Terpisah
                        </span>
                      )}
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                <tr className={rowBgClass("pet")}>
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                    Hewan Peliharaan
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <FeatureCheckItem
                        enabled={p.is_pet_friendly}
                        trueText="Boleh Bawa Hewan"
                        falseText="Dilarang Bawa Hewan"
                      />
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>

                {/* Final Row: CTA */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/70">
                  <td className="p-4 sm:p-5 font-bold text-slate-500 sticky left-0 z-10 bg-slate-50/95 dark:bg-slate-900/95">
                    Keputusan Booking
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 sm:p-5">
                      <Link
                        href={`/kos/${p.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-soft hover:shadow-float flex items-center justify-center gap-1.5"
                      >
                        <span>Pilih Kos Ini</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  ))}
                  {properties.length < 3 && <td className="p-4 sm:p-5" />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Check Icon Item
function FeatureCheckItem({
  enabled,
  trueText,
  falseText,
}: {
  enabled: boolean;
  trueText: string;
  falseText: string;
}) {
  return (
    <div className="flex items-center gap-1.5 font-medium">
      {enabled ? (
        <>
          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800">
            <Check className="w-3 h-3" />
          </div>
          <span className="text-slate-800 dark:text-slate-200">{trueText}</span>
        </>
      ) : (
        <>
          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <X className="w-3 h-3" />
          </div>
          <span className="text-slate-400 dark:text-slate-500">{falseText}</span>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Memuat halaman komparasi...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}

