"use client";

import React, { useState, useEffect, useMemo } from "react";
import MapViewer, { PropertyMapItem } from "@/components/MapViewer";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Home,
  CheckCircle2,
  XCircle,
  Map as MapIcon,
  List,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function MapSearchPage() {
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

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

  // Filter properties based on search query, gender, and price
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
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

      // Query filter (name, address, facilities)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchAddress = p.address ? p.address.toLowerCase().includes(query) : false;
        const matchFacilities = p.facilities.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchFacilities) {
          return false;
        }
      }

      return true;
    });
  }, [properties, selectedGender, maxPrice, searchQuery]);

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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1 border border-emerald-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Peta Interaktif Google Maps</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Eksplorasi Kos Berdasarkan Lokasi
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Cari dan amankan kamar kos terdekat dengan ketersediaan real-time.
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

          {/* Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kos, alamat, atau fasilitas..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Gender Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: "ALL", label: "Semua Tipe" },
                { id: "PUTRA", label: "Putra" },
                { id: "PUTRI", label: "Putri" },
                { id: "CAMPUR", label: "Campur" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGender(g.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGender === g.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="w-full md:w-44">
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
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
                {filteredProperties.length} Kos Ditemukan
              </span>
              {selectedPropertyId && (
                <button
                  onClick={() => setSelectedPropertyId(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Memuat data kos...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Home className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  Kos Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Coba sesuaikan kata kunci pencarian atau ubah filter gender dan harga Anda.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedGender("ALL");
                    setMaxPrice("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
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
                          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20"
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
                            <div className="flex items-center gap-1 text-[11px] mb-1">
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
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
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
                              <span className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
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
              onSelectProperty={(p) => setSelectedPropertyId(p ? p.id : null)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
