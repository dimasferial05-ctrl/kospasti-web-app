"use client";

import React, { useState, useEffect, useMemo } from "react";
import MapViewer, { PropertyMapItem, SearchTargetLocation } from "@/components/MapViewer";
import Link from "next/link";
import {
  MapPin,
  Home,
  CheckCircle2,
  XCircle,
  Map as MapIcon,
  List,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  RotateCcw,
  Compass,
  AlertCircle,
  Send,
  Tag,
} from "lucide-react";

interface AISearchCriteria {
  location_intent: string | null;
  target_latitude?: number | null;
  target_longitude?: number | null;
  max_price: number | null;
  gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null;
  facilities_keywords: string[];
}

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface GoogleGeocodeResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

async function geocodeLocation(
  query: string,
  apiKey?: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  if (typeof window !== "undefined") {
    const googleObj = (window as unknown as { google?: { maps?: { Geocoder: new () => { geocode: (req: unknown, cb: (results: GoogleGeocodeResult[] | null, status: string) => void) => void } } } }).google;
    if (googleObj?.maps?.Geocoder) {
      try {
        const geocoder = new googleObj.maps.Geocoder();
        const res = await new Promise<GoogleGeocodeResult | null>((resolve) => {
          geocoder.geocode(
            { address: query, componentRestrictions: { country: "ID" } },
            (results, status) => {
              if (status === "OK" && results && results[0]) {
                resolve(results[0]);
              } else {
                geocoder.geocode({ address: query }, (r2, s2) => {
                  if (s2 === "OK" && r2 && r2[0]) resolve(r2[0]);
                  else resolve(null);
                });
              }
            }
          );
        });
        if (res) {
          return {
            lat: res.geometry.location.lat(),
            lng: res.geometry.location.lng(),
            name: query,
          };
        }
      } catch (e) {
        console.warn("Client JS Geocoder failed:", e);
      }
    }
  }

  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query
        )}&region=id&key=${apiKey}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
          name: query,
        };
      }
    } catch (e) {
      console.warn("Fetch geocoding failed:", e);
    }
  }

  return null;
}

const EXAMPLE_PROMPTS = [
  "Kos putri dekat UI ada AC harga di bawah 2 juta",
  "Kos putra dekat Monas Jakarta fasilitas WiFi",
  "Kos campur dekat Mall Gandaria City budget 1.5jt",
  "Kos murah dekat kampus ada parkir motor",
];

export default function MapSearchPage() {
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeCriteria, setActiveCriteria] = useState<AISearchCriteria | null>(null);

  // Filter States
  const [selectedGender, setSelectedGender] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [facilitiesFilter, setFacilitiesFilter] = useState<string[]>([]);

  // Search Target (Geocoded coordinates from AI)
  const [searchTarget, setSearchTarget] = useState<SearchTargetLocation | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/properties");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
        }
      } catch (err) {
        console.error("Gagal memuat properti kos:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const handleAISearch = async (promptText?: string) => {
    const textToSearch = (promptText || aiPrompt).trim();
    if (!textToSearch) return;

    try {
      setIsAiLoading(true);
      setAiError(null);

      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSearch }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal memproses pencarian AI.");
      }

      const criteria: AISearchCriteria = result.data;
      setActiveCriteria(criteria);

      // Sinkronkan filter Gender jika diekstrak oleh AI
      if (criteria.gender_type) {
        setSelectedGender(criteria.gender_type);
      }

      // Sinkronkan filter Max Price jika diekstrak oleh AI
      if (criteria.max_price !== null && !isNaN(criteria.max_price)) {
        setMaxPrice(criteria.max_price.toString());
      }

      // Sinkronkan kata kunci fasilitas
      if (Array.isArray(criteria.facilities_keywords)) {
        setFacilitiesFilter(criteria.facilities_keywords);
      }

      // Tentukan koordinat target pencarian
      if (
        criteria.location_intent &&
        typeof criteria.target_latitude === "number" &&
        typeof criteria.target_longitude === "number"
      ) {
        // Koordinat sudah diekstrak cerdas langsung oleh AI tanpa perlu Geocoding Google Cloud
        setSearchTarget({
          lat: criteria.target_latitude,
          lng: criteria.target_longitude,
          name: criteria.location_intent,
        });
      } else if (criteria.location_intent) {
        // Fallback geocode jika AI tidak memberikan koordinat
        const geoResult = await geocodeLocation(criteria.location_intent, mapsApiKey);
        if (geoResult) {
          setSearchTarget(geoResult);
        } else {
          setSearchTarget(null);
        }
      } else {
        setSearchTarget(null);
      }
    } catch (err: unknown) {
      console.error("Error AI search:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pertanyaan Anda.";
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetFilters = () => {
    setAiPrompt("");
    setActiveCriteria(null);
    setSelectedGender("ALL");
    setMaxPrice("");
    setFacilitiesFilter([]);
    setSearchTarget(null);
    setAiError(null);
    setSelectedPropertyId(null);
  };

  // Filter & Sort properties based on AI criteria & search target distance
  const filteredProperties = useMemo(() => {
    const list = properties
      .map((p) => {
        let distance: number | null = null;
        if (
          searchTarget &&
          typeof p.latitude === "number" &&
          typeof p.longitude === "number"
        ) {
          distance = calculateDistanceKm(
            searchTarget.lat,
            searchTarget.lng,
            p.latitude,
            p.longitude
          );
        }
        return {
          ...p,
          distance_km: distance,
        };
      })
      .filter((p) => {
        // Gender filter
        if (
          selectedGender !== "ALL" &&
          p.gender_type.toUpperCase() !== selectedGender.toUpperCase()
        ) {
          return false;
        }

        // Max price filter
        if (maxPrice && !isNaN(Number(maxPrice))) {
          if (p.price_per_month > Number(maxPrice)) {
            return false;
          }
        }

        // Facilities keywords filter
        if (facilitiesFilter.length > 0) {
          const facilitiesLower = p.facilities.toLowerCase();
          const matchesAllFacilities = facilitiesFilter.some((fac) =>
            facilitiesLower.includes(fac.toLowerCase().trim())
          );
          if (!matchesAllFacilities) {
            return false;
          }
        }

        return true;
      });

    // Sort by nearest distance if search target coordinates exist
    if (searchTarget) {
      list.sort((a, b) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return list;
  }, [properties, selectedGender, maxPrice, facilitiesFilter, searchTarget]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header & Search Bar */}
        <div className="mb-6">
          {/* Tombol Kembali ke Beranda */}
          <div className="mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors group py-1"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200/70 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-700" />
              </div>
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-700 text-xs font-bold mb-1.5 border border-indigo-200/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Pencarian Cerdas AI + Google Maps</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Eksplorasi Kos Berdasarkan Lokasi & Kebutuhan
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Ketik kebutuhan kos Anda dalam bahasa sehari-hari. AI akan merekomendasikan kos terdekat.
              </p>
            </div>

            {/* Mobile View Toggle Buttons */}
            <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMobileView("map")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  mobileView === "map"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Peta</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  mobileView === "list"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-4 h-4" />
                <span>Daftar ({filteredProperties.length})</span>
              </button>
            </div>
          </div>

          {/* AI Search Card */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-md mb-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none"></div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAISearch();
              }}
              className="flex flex-col gap-3 relative z-10"
            >
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isAiLoading}
                    placeholder='Tanya AI: "Kos putri dekat UI ada AC harga di bawah 2 juta..."'
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Tanya AI</span>
                      </>
                    )}
                  </button>

                  {(activeCriteria || selectedGender !== "ALL" || maxPrice || searchTarget) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all flex items-center gap-1.5"
                      title="Reset Pencarian"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Example Prompts Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Coba tanya:
                </span>
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(prompt);
                      handleAISearch(prompt);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-slate-200/60 font-medium cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {aiError && (
                <div className="mt-1 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Active AI Extracted Criteria Badges */}
              {activeCriteria && (
                <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Kriteria AI Diterapkan:
                  </span>

                  {searchTarget && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      📍 Lokasi: {searchTarget.name}
                    </span>
                  )}

                  {activeCriteria.gender_type && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-pink-50 text-pink-700 border border-pink-200/80">
                      👥 Tipe: {activeCriteria.gender_type}
                    </span>
                  )}

                  {activeCriteria.max_price && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      💰 Maks: {formatRupiah(activeCriteria.max_price)}
                    </span>
                  )}

                  {activeCriteria.facilities_keywords && activeCriteria.facilities_keywords.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
                      <Tag className="w-3 h-3" />
                      Fasilitas: {activeCriteria.facilities_keywords.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </form>

            {/* Quick Adjustment Toolbar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Filter Manual:</span>
                {/* Gender Pills */}
                <div className="flex items-center gap-1">
                  {[
                    { id: "ALL", label: "Semua" },
                    { id: "PUTRA", label: "Putra" },
                    { id: "PUTRI", label: "Putri" },
                    { id: "CAMPUR", label: "Campur" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGender(g.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedGender === g.id
                          ? "bg-slate-800 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Harga:</span>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="">Semua Harga</option>
                  <option value="1000000">Maks. Rp 1 Jt</option>
                  <option value="1500000">Maks. Rp 1.5 Jt</option>
                  <option value="2000000">Maks. Rp 2 Jt</option>
                  <option value="3000000">Maks. Rp 3 Jt</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Column: Room Cards List (Desktop: col-span-5, Mobile: controlled by toggle) */}
          <div
            className={`lg:col-span-5 flex-col ${
              mobileView === "list" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {filteredProperties.length} Kos Ditemukan {searchTarget && "(Diurutkan Terdekat)"}
              </span>
              {selectedPropertyId && (
                <button
                  onClick={() => setSelectedPropertyId(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Memuat data kos...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Home className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  Kos Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Tidak ada kos yang cocok dengan kriteria AI atau filter yang dipilih. Coba sesuaikan pertanyaan Anda.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[calc(100vh-280px)] scrollbar-thin">
                {filteredProperties.map((property) => {
                  const isSelected = selectedPropertyId === property.id;
                  const isHovered = hoveredPropertyId === property.id;
                  const isAvailable = property.available_rooms > 0;

                  return (
                    <div
                      key={property.id}
                      onMouseEnter={() => setHoveredPropertyId(property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        if (window.innerWidth < 1024) {
                          setMobileView("map");
                        }
                      }}
                      className={`group bg-white rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20"
                          : isHovered
                          ? "border-slate-400 shadow-md translate-x-1"
                          : "border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex gap-3.5">
                        {/* Thumbnail Image */}
                        <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                          {property.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={property.image_url}
                              alt={property.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                              KosPasti
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm ${
                                property.gender_type === "PUTRI"
                                    ? "bg-pink-600 text-white"
                                    : property.gender_type === "PUTRA"
                                    ? "bg-blue-600 text-white"
                                    : "bg-purple-600 text-white"
                              }`}
                            >
                              {property.gender_type}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                              {isAvailable ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Sisa {property.available_rooms} Kamar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded">
                                  <XCircle className="w-3 h-3 text-red-600" />
                                  Kamar Penuh
                                </span>
                              )}

                              {typeof property.distance_km === "number" && (
                                <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] border border-indigo-200/60">
                                  📍 {property.distance_km} km
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {property.name}
                            </h3>

                            {property.address && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                <span>{property.address}</span>
                              </p>
                            )}

                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                              {property.facilities}
                            </p>
                          </div>

                          <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-xs font-black text-emerald-600">
                                {formatRupiah(property.price_per_month)}
                              </span>
                              <span className="text-[10px] text-slate-400">/bln</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                <span>Peta</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Google Maps Container (Desktop: col-span-7, Mobile: controlled by toggle) */}
          <div
            className={`lg:col-span-7 h-[500px] sm:h-[580px] lg:h-auto ${
              mobileView === "map" ? "flex" : "hidden lg:flex"
            }`}
          >
            <MapViewer
              properties={filteredProperties}
              selectedPropertyId={selectedPropertyId}
              hoveredPropertyId={hoveredPropertyId}
              searchTarget={searchTarget}
              onSelectProperty={(p) => setSelectedPropertyId(p ? p.id : null)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
