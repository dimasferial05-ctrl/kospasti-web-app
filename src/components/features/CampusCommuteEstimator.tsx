"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GraduationCap,
  Footprints,
  Car,
  MapPin,
  CheckCircle2,
  Navigation,
  Loader2,
  Building2,
  ChevronRight,
} from "lucide-react";

export interface CommuteLocation {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  walkMinutes: number;
  driveMinutes: number;
  walkFormatted: string;
  driveFormatted: string;
  isWalkable: boolean;
  latitude: number;
  longitude: number;
}

interface CampusCommuteEstimatorProps {
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyName: string;
  onSelectDestination?: (location: CommuteLocation | null) => void;
  className?: string;
}

export function CampusCommuteEstimator({
  propertyLat,
  propertyLng,
  propertyName,
  onSelectDestination,
  className = "",
}: CampusCommuteEstimatorProps) {
  const [locations, setLocations] = useState<CommuteLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<CommuteLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"kampus" | "all">("kampus");

  const onSelectDestinationRef = useRef(onSelectDestination);
  useEffect(() => {
    onSelectDestinationRef.current = onSelectDestination;
  }, [onSelectDestination]);

  // Notifikasi perubahan destinasi ke komponen induk secara pasif (setelah render selesai)
  useEffect(() => {
    onSelectDestinationRef.current?.(selectedLocation);
  }, [selectedLocation]);

  const hasCoords =
    typeof propertyLat === "number" &&
    typeof propertyLng === "number" &&
    !isNaN(propertyLat) &&
    !isNaN(propertyLng) &&
    propertyLat !== 0 &&
    propertyLng !== 0;

  const fetchNearby = useCallback(
    async (category: "kampus" | "all") => {
      if (!hasCoords) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lat: String(propertyLat),
          lng: String(propertyLng),
          category: category,
          limit: "8",
        });

        const res = await fetch(`/api/locations/nearby?${params.toString()}`);
        const result = await res.json();

        if (res.ok && result.success && Array.isArray(result.data)) {
          setLocations(result.data);
          if (result.data.length > 0) {
            // Default pilih destinasi terdekat jika belum ada yang dipilih (state updater murni tanpa side-effect)
            setSelectedLocation((prev) => {
              if (prev && result.data.some((l: CommuteLocation) => l.id === prev.id)) {
                return prev;
              }
              return result.data[0];
            });
          } else {
            setSelectedLocation(null);
          }
        } else {
          setError(result.error || "Gagal memuat lokasi sekitar");
        }
      } catch (err) {
        console.warn("Gagal mengambil data estimasi waktu tempuh:", err);
        setError("Koneksi gagal saat mengambil estimasi waktu tempuh");
      } finally {
        setIsLoading(false);
      }
    },
    [hasCoords, propertyLat, propertyLng]
  );

  useEffect(() => {
    if (hasCoords) {
      fetchNearby(activeTab);
    }
  }, [hasCoords, activeTab, fetchNearby]);

  const handleSelectLocation = (loc: CommuteLocation) => {
    setSelectedLocation(loc);
  };

  const handleScrollToMap = () => {
    const mapElement = document.getElementById("property-map-section");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!hasCoords) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 md:p-6 transition-all ${className}`}
      data-testid="campus-commute-estimator"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-2xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Estimasi Waktu Tempuh ke Kampus &amp; Sekitar
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Kalkulasi durasi perjalanan realistis dari {propertyName} ke tempat tujuan Anda.
            </p>
          </div>
        </div>

        {/* Tab Filter Sederhana */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab("kampus")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "kampus"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kampus &amp; Sekolah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua Tempat
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Menghitung jarak &amp; waktu tempuh...</span>
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-rose-500 font-medium">
          {error}
        </div>
      ) : locations.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          Belum ada data kampus terdaftar di sekitar koordinat kos ini.
        </div>
      ) : (
        <div className="pt-4 space-y-4">
          {/* Destination Selection Chips */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Pilih Kampus / Tempat Tujuan Anda:
            </label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80"
                    }`}
                  >
                    {loc.category === "kampus" || loc.category === "sekolah" ? (
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate max-w-[170px] sm:max-w-[220px]">{loc.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {loc.distanceKm} km
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Highlight Card */}
          {selectedLocation && (
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    {selectedLocation.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {selectedLocation.distanceKm} km
                  </span>
                </div>

                {selectedLocation.isWalkable && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Bisa Jalan Kaki
                  </span>
                )}
              </div>

              {/* Grid 2 Kartu Komputasi: Jalan Kaki & Motor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opsi Jalan Kaki */}
                <div className="bg-white rounded-xl border border-emerald-100 p-3.5 shadow-2xs flex items-center justify-between hover:border-emerald-300 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Footprints className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">
                        Jalan Kaki
                      </span>
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedLocation.walkFormatted}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 text-right">
                    ~4.5 km/jam
                  </span>
                </div>

                {/* Opsi Berkendara Motor */}
                <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-2xs flex items-center justify-between hover:border-blue-300 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">
                        Motor / Mobil
                      </span>
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedLocation.driveFormatted}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 text-right">
                    Lalu lintas kota
                  </span>
                </div>
              </div>

              {/* Action Button: Arahkan ke Peta */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-400">
                  Ingin melihat rute jalan dan belokan spesifik?
                </span>
                <button
                  type="button"
                  onClick={handleScrollToMap}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-lg transition active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Lihat Rute di Peta Bawah</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CampusCommuteEstimator;

