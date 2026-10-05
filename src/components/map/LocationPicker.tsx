"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Maximize2,
  Crosshair,
} from "lucide-react";

export interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  label?: string;
  helperText?: string;
  className?: string;
  height?: string;
  disabled?: boolean;
}

// Pusat default jika belum ada koordinat (Pusat Jakarta / Monas)
const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 };
const DEFAULT_ZOOM = 13;
const DETAIL_ZOOM = 16;

/**
 * Controller untuk menangani klik pada peta dan memusatkan kamera saat koordinat diperbarui secara eksternal/GPS
 */
function MapInteractionController({
  markerPosition,
  panTrigger,
  zoomLevel,
  onChange,
  disabled,
}: {
  markerPosition: { lat: number; lng: number } | null;
  panTrigger: number;
  zoomLevel?: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const map = useMap();

  // Pusatkan peta saat panTrigger bertambah (misal tombol lokasi saya ditekan)
  useEffect(() => {
    if (!map || !markerPosition || panTrigger === 0) return;
    map.panTo(markerPosition);
    if (zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [map, markerPosition, panTrigger, zoomLevel]);

  // Listener untuk klik pada peta
  useEffect(() => {
    if (!map || disabled) return;

    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : Number(e.latLng.lat);
      const lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : Number(e.latLng.lng);
      onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onChange, disabled]);

  return null;
}

/**
 * Komponen Error Boundary sederhana untuk menangkap kegagalan Google Maps
 */
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("LocationPicker Map Error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  label = "Titik Lokasi di Peta",
  helperText = "Geser pin merah atau klik pada peta untuk menentukan posisi akurat bangunan kos Anda.",
  className = "",
  height = "320px",
  disabled = false,
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Validasi koordinat yang dikirimkan
  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  const currentMarker = useMemo(() => {
    if (hasValidCoordinates) {
      return { lat: latitude as number, lng: longitude as number };
    }
    return null;
  }, [hasValidCoordinates, latitude, longitude]);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [panTrigger, setPanTrigger] = useState(0);
  const [targetZoom, setTargetZoom] = useState(DEFAULT_ZOOM);
  const hasAttemptedAutoLocate = useRef(false);

  // Ambil lokasi terkini dari browser Geolocation API
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        onChange(lat, lng);
        setTargetZoom(DETAIL_ZOOM);
        setPanTrigger((prev) => prev + 1);
        setIsLocating(false);
        setLocationSuccess("Berhasil mendapatkan lokasi terkini Anda!");

        setTimeout(() => {
          setLocationSuccess(null);
        }, 4000);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Gagal mengambil lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin akses lokasi ditolak oleh browser. Anda tetap bisa menggeser pin di peta secara manual.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informasi lokasi tidak tersedia pada perangkat ini.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu permintaan lokasi habis. Silakan coba lagi.";
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  // Efek saat pertama kali dimount: jika belum ada koordinat, otomatis minta lokasi terkini
  useEffect(() => {
    if (!hasValidCoordinates && !hasAttemptedAutoLocate.current && !disabled) {
      hasAttemptedAutoLocate.current = true;
      handleGetCurrentLocation();
    }
  }, [hasValidCoordinates, handleGetCurrentLocation, disabled]);

  // Handler saat pin selesai digeser (dragend)
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : Number(e.latLng.lat);
      const lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : Number(e.latLng.lng);

      onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      setLocationError(null);
    },
    [onChange]
  );

  // Fallback jika API key tidak tersedia atau error
  const fallbackUI = (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Peta interaktif tidak dapat dimuat (API Key belum siap)</span>
      </div>
      <p className="text-amber-700">
        Anda tetap dapat mengisi atau memeriksa titik Latitude dan Longitude secara manual pada input di bawah.
      </p>
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="-6.2088"
            value={latitude ?? ""}
            onChange={(e) => onChange(Number(e.target.value), longitude ?? 0)}
            disabled={disabled}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="106.8456"
            value={longitude ?? ""}
            onChange={(e) => onChange(latitude ?? 0, Number(e.target.value))}
            disabled={disabled}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>
    </div>
  );

  if (!apiKey) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
        {fallbackUI}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          {label && (
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {label}
            </label>
          )}
          {helperText && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{helperText}</p>
          )}
        </div>

        {/* Tombol Ambil Lokasi Saya */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating || disabled}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-emerald-200 transition cursor-pointer shrink-0 shadow-2xs"
          title="Gunakan lokasi GPS perangkat saat ini"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Mencari Lokasi...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lokasi Saya Saat Ini</span>
            </>
          )}
        </button>
      </div>

      {/* Notifikasi Status Lokasi */}
      {locationSuccess && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{locationSuccess}</span>
        </div>
      )}

      {locationError && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
        style={{ height }}
      >
        <MapErrorBoundary fallback={fallbackUI}>
          <APIProvider apiKey={apiKey} language="id" region="ID">
            <Map
              defaultCenter={currentMarker || DEFAULT_CENTER}
              defaultZoom={hasValidCoordinates ? DETAIL_ZOOM : DEFAULT_ZOOM}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              fullscreenControl={false}
              streetViewControl={false}
              mapTypeControl={false}
              keyboardShortcuts={false}
              className="w-full h-full"
            >
              <MapInteractionController
                markerPosition={currentMarker}
                panTrigger={panTrigger}
                zoomLevel={targetZoom}
                onChange={onChange}
                disabled={disabled}
              />

              {/* Marker Draggable untuk Lokasi Kos */}
              {currentMarker && (
                <AdvancedMarker
                  position={currentMarker}
                  draggable={!disabled}
                  onDragEnd={handleMarkerDragEnd}
                  title="Geser pin untuk memindahkan posisi kos"
                >
                  <div className="relative flex flex-col items-center group cursor-grab active:cursor-grabbing select-none">
                    <div className="px-2 py-0.5 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-bold rounded shadow-md mb-1 border border-slate-700 whitespace-nowrap animate-bounce">
                      📍 Titik Kos (Bisa Digeser)
                    </div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center shadow-xl ring-4 ring-rose-500/30 transform group-hover:scale-110 transition">
                      <MapPin className="w-5 h-5 fill-white text-rose-600" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        </MapErrorBoundary>
      </div>

      {/* Coordinate Badges & Petunjuk Interaksi */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500">Koordinat Terpilih:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 font-medium">
            Lat: {hasValidCoordinates ? (latitude as number).toFixed(6) : "Belum ditentukan"}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 font-medium">
            Lng: {hasValidCoordinates ? (longitude as number).toFixed(6) : "Belum ditentukan"}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Klik di mana saja pada peta atau geser pin merah.</span>
        </div>
      </div>
    </div>
  );
}
