"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Navigation, ExternalLink, Users, AlertCircle } from "lucide-react";

export interface PropertyMapItem {
  id: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  gender_type: string;
  facilities: string;
  image_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  owner?: {
    name: string;
  };
}

interface MapViewerProps {
  properties: PropertyMapItem[];
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  onSelectProperty?: (property: PropertyMapItem | null) => void;
  apiKey?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Default center: Jakarta Pusat (Monas area)
const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 };
const DEFAULT_ZOOM = 12;

function formatPriceBadge(price: number): string {
  if (price >= 1_000_000) {
    const formatted = (price / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `Rp ${formatted}jt`;
  }
  return `Rp ${Math.round(price / 1_000)}rb`;
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

// Controller component to smoothly pan/zoom to selected property
function MapCameraController({
  selectedProperty,
  userLocation,
}: {
  selectedProperty?: PropertyMapItem | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (
      selectedProperty &&
      typeof selectedProperty.latitude === "number" &&
      typeof selectedProperty.longitude === "number"
    ) {
      map.panTo({
        lat: selectedProperty.latitude,
        lng: selectedProperty.longitude,
      });
      if (map.getZoom() && (map.getZoom() as number) < 14) {
        map.setZoom(14);
      }
    }
  }, [map, selectedProperty]);

  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(14);
  }, [map, userLocation]);

  return null;
}

export default function MapViewer({
  properties,
  selectedPropertyId,
  hoveredPropertyId,
  onSelectProperty,
  apiKey,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapViewerProps) {
  const [activeProperty, setActiveProperty] = useState<PropertyMapItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const effectiveApiKey =
    apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Sinkronisasi activeProperty saat selectedPropertyId berubah dari luar (misal klik card)
  useEffect(() => {
    if (selectedPropertyId) {
      const found = properties.find((p) => p.id === selectedPropertyId);
      if (found) {
        setActiveProperty(found);
      }
    } else {
      setActiveProperty(null);
    }
  }, [selectedPropertyId, properties]);

  const handleMarkerClick = useCallback(
    (property: PropertyMapItem) => {
      setActiveProperty(property);
      if (onSelectProperty) {
        onSelectProperty(property);
      }
    },
    [onSelectProperty]
  );

  const handleInfoWindowClose = useCallback(() => {
    setActiveProperty(null);
    if (onSelectProperty) {
      onSelectProperty(null);
    }
  }, [onSelectProperty]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Gagal mendeteksi lokasi saat ini.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Filter properties with valid coordinates
  const validProperties = properties.filter(
    (p) =>
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );

  if (!effectiveApiKey) {
    return (
      <div className="relative w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Google Maps API Key Belum Dikonfigurasi
        </h3>
        <p className="text-sm text-slate-600 max-w-md mb-4">
          Untuk menampilkan peta interaktif Google Maps, masukkan variabel{" "}
          <code className="bg-slate-200 px-1.5 py-0.5 rounded text-amber-700 font-mono text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          pada file <code className="font-mono text-xs">.env</code> Anda.
        </p>
        <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
          📍 {validProperties.length} kos dengan koordinat siap ditampilkan setelah API Key aktif.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      <APIProvider apiKey={effectiveApiKey} language="id" region="ID">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          style={{ width: "100%", height: "100%", minHeight: "450px" }}
        >
          <MapCameraController
            selectedProperty={activeProperty}
            userLocation={userLocation}
          />

          {/* User Location Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Lokasi Anda Saat Ini">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
                <div className="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Kos Property Markers */}
          {validProperties.map((property) => {
            const isSelected = activeProperty?.id === property.id;
            const isHovered = hoveredPropertyId === property.id;
            const isFull = property.available_rooms <= 0;

            let badgeBg = "bg-emerald-600 text-white border-emerald-700";
            if (isFull) {
              badgeBg = "bg-slate-600 text-slate-100 border-slate-700";
            }
            if (isSelected || isHovered) {
              badgeBg = "bg-amber-600 text-white border-amber-700 scale-110 shadow-lg ring-4 ring-amber-300/60";
            }

            return (
              <AdvancedMarker
                key={property.id}
                position={{
                  lat: property.latitude as number,
                  lng: property.longitude as number,
                }}
                onClick={() => handleMarkerClick(property)}
                title={property.name}
              >
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1 select-none ${badgeBg}`}
                >
                  <span>{formatPriceBadge(property.price_per_month)}</span>
                  {isFull && (
                    <span className="text-[10px] bg-red-500 text-white px-1 py-0.2 rounded-full">
                      Penuh
                    </span>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow Popup on Marker Click */}
          {activeProperty &&
            typeof activeProperty.latitude === "number" &&
            typeof activeProperty.longitude === "number" && (
              <InfoWindow
                position={{
                  lat: activeProperty.latitude,
                  lng: activeProperty.longitude,
                }}
                onCloseClick={handleInfoWindowClose}
                pixelOffset={[0, -28]}
              >
                <div className="w-64 p-1 text-slate-800">
                  {activeProperty.image_url ? (
                    <div className="relative w-full h-32 mb-2.5 rounded-lg overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeProperty.image_url}
                        alt={activeProperty.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 mb-2.5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      Tidak ada foto
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                        activeProperty.gender_type === "PUTRI"
                          ? "bg-pink-100 text-pink-700"
                          : activeProperty.gender_type === "PUTRA"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {activeProperty.gender_type}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        activeProperty.available_rooms > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {activeProperty.available_rooms > 0
                        ? `Sisa ${activeProperty.available_rooms} Kamar`
                        : "Kamar Penuh"}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                    {activeProperty.name}
                  </h4>

                  {activeProperty.address && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>{activeProperty.address}</span>
                    </p>
                  )}

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 mb-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga Sewa</span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        {formatRupiah(activeProperty.price_per_month)}
                      </span>
                      <span className="text-[10px] text-slate-500">/bln</span>
                    </div>
                  </div>

                  <Link
                    href={`/kos/${activeProperty.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    <span>Lihat Detail Kos</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </InfoWindow>
            )}
        </Map>
      </APIProvider>

      {/* Floating Action Button: Current Location */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        aria-label="Gunakan lokasi saya saat ini"
        className="absolute top-4 right-4 z-10 bg-white/95 hover:bg-white text-slate-700 p-2.5 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
      >
        <Navigation
          className={`w-4 h-4 text-emerald-600 ${isLocating ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">
          {isLocating ? "Mencari..." : "Lokasi Saya"}
        </span>
      </button>

      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-10 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg shadow-sm">
          {locationError}
        </div>
      )}
    </div>
  );
}
