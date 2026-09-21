"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Loader2,
  AlertCircle,
  Car,
  Footprints,
  RotateCcw,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface PropertyLocationMapProps {
  propertyName: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface UserLocation {
  lat: number;
  lng: number;
}

type TravelMode = "DRIVING" | "WALKING";

// Algoritma standar untuk mendecode polyline Google Maps
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Komponen untuk menggambar garis rute di atas Google Maps
function RoutePolyline({
  path,
  isActualRoad,
}: {
  path: { lat: number; lng: number }[];
  isActualRoad: boolean;
}) {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLibrary || path.length === 0) return;

    if (!polylineRef.current) {
      polylineRef.current = new mapsLibrary.Polyline({
        path,
        geodesic: true,
        strokeColor: isActualRoad ? "#2563EB" : "#3B82F6",
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
    } else {
      polylineRef.current.setPath(path);
      polylineRef.current.setOptions({
        strokeColor: isActualRoad ? "#2563EB" : "#3B82F6",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      });
      polylineRef.current.setMap(map);
    }

    // Auto fit bounds
    try {
      if (typeof google !== "undefined" && google.maps?.LatLngBounds) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, {
          top: 60,
          bottom: 60,
          left: 60,
          right: 60,
        });
      }
    } catch (e) {
      console.warn("fitBounds failed:", e);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, mapsLibrary, path, isActualRoad]);

  return null;
}

// Controller untuk memusatkan peta ke koordinat kos
function MapCenterController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center]);

  return null;
}

export default function PropertyLocationMap({
  propertyName,
  address,
  latitude,
  longitude,
}: PropertyLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  const kosCoords = useMemo(
    () => ({
      lat: latitude ?? -6.2088,
      lng: longitude ?? 106.8456,
    }),
    [latitude, longitude]
  );

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    isActualRoad: boolean;
  } | null>(null);
  const [polylinePoints, setPolylinePoints] = useState<
    { lat: number; lng: number }[]
  >([]);

  // Hitung rute via backend modern API Routes
  const fetchRouteData = useCallback(
    async (userLoc: UserLocation, mode: TravelMode) => {
      if (!hasValidCoordinates) return;
      setIsCalculatingRoute(true);
      setLocationError(null);

      try {
        const response = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: userLoc,
            destination: kosCoords,
            travelMode: mode,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.data) {
          setRouteInfo({
            distance: data.data.distance,
            duration: data.data.duration,
            isActualRoad: data.data.isActualRoad ?? false,
          });

          if (data.data.encodedPolyline) {
            const points = decodePolyline(data.data.encodedPolyline);
            setPolylinePoints(points);
          } else if (
            Array.isArray(data.data.coordinates) &&
            data.data.coordinates.length > 0
          ) {
            setPolylinePoints(data.data.coordinates);
          } else {
            // Fallback straight line
            setPolylinePoints([userLoc, kosCoords]);
          }
        } else {
          // Fallback manual straight line
          setPolylinePoints([userLoc, kosCoords]);
          setRouteInfo({
            distance: "Terhitung",
            duration: "Lihat Google Maps",
            isActualRoad: false,
          });
        }
      } catch (err) {
        console.warn("Gagal menghitung rute:", err);
        setPolylinePoints([userLoc, kosCoords]);
      } finally {
        setIsCalculatingRoute(false);
      }
    },
    [hasValidCoordinates, kosCoords]
  );

  // Ambil geolokasi pengguna
  const handleGetLocationAndRoute = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError(
        "Browser Anda tidak mendukung fitur pendeteksi lokasi (Geolocation)."
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userLoc);
        setIsLocating(false);
        fetchRouteData(userLoc, travelMode);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              "Izin lokasi ditolak. Mohon aktifkan izin lokasi pada browser Anda untuk melihat rute."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Informasi lokasi tidak tersedia saat ini.");
            break;
          case err.TIMEOUT:
            setLocationError("Waktu permintaan lokasi habis. Silakan coba lagi.");
            break;
          default:
            setLocationError("Gagal mendeteksi lokasi Anda.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, [fetchRouteData, travelMode]);

  // Mode travel mode toggle
  const handleModeChange = (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (userLocation) {
      fetchRouteData(userLocation, newMode);
    }
  };

  const handleResetRoute = () => {
    setUserLocation(null);
    setRouteInfo(null);
    setPolylinePoints([]);
    setLocationError(null);
  };

  // URL navigasi langsung ke Google Maps
  const googleMapsUrl = hasValidCoordinates
    ? userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${latitude},${longitude}&travelmode=${travelMode.toLowerCase()}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address + " " + propertyName
      )}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col gap-4 p-4 sm:p-5">
      {/* Header Bagian Lokasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Lokasi & Akses Sekitar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {address || "Alamat lengkap kos belum ditambahkan oleh pemilik."}
            </p>
          </div>
        </div>

        {/* Tombol Buka di Google Maps Eksternal */}
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 rounded-lg border border-blue-200 transition shrink-0"
            title="Buka petunjuk arah di aplikasi Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Petunjuk Arah</span>
          </a>
        )}
      </div>

      {/* Konten Peta atau Fallback */}
      {hasValidCoordinates ? (
        <div className="flex flex-col gap-3">
          {/* Action Bar Kalkulator Rute */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {!userLocation ? (
                <button
                  type="button"
                  onClick={handleGetLocationAndRoute}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendeteksi Lokasi...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Cek Jarak & Rute dari Lokasi Saya</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mode Selector */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleModeChange("DRIVING")}
                      disabled={isCalculatingRoute}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        travelMode === "DRIVING"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Mode Berkendara (Mobil / Motor)"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>Berkendara</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange("WALKING")}
                      disabled={isCalculatingRoute}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        travelMode === "WALKING"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Mode Jalan Kaki"
                    >
                      <Footprints className="w-3.5 h-3.5" />
                      <span>Jalan Kaki</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetRoute}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                    title="Reset Rute"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Info Badge Jarak & Waktu jika rute sudah dihitung */}
            {isCalculatingRoute ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>
                  Menghitung rute {travelMode === "WALKING" ? "jalan kaki" : "berkendara"}...
                </span>
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium animate-fadeIn">
                {travelMode === "WALKING" ? (
                  <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {travelMode === "WALKING" ? "Jalan Kaki" : "Berkendara"}:
                  </span>
                  <span>
                    Jarak <strong>{routeInfo.distance}</strong>
                  </span>
                  <span className="text-emerald-300">•</span>
                  <span>
                    Waktu <strong>{routeInfo.duration}</strong>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Notifikasi Error jika gagal dapat lokasi */}
          {locationError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Container Google Maps */}
          <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner">
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={kosCoords}
                defaultZoom={15}
                mapId="DEMO_MAP_ID"
                fullscreenControl={false}
                streetViewControl={false}
                mapTypeControl={false}
                gestureHandling="cooperative"
                keyboardShortcuts={false}
                internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
                className="w-full h-full"
              >
                {!userLocation && <MapCenterController center={kosCoords} />}

                {/* Marker Kos */}
                <AdvancedMarker position={kosCoords} title={propertyName}>
                  <div className="flex flex-col items-center group cursor-pointer">
                    <div className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-md mb-1 border border-slate-700 whitespace-nowrap">
                      {propertyName}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                      <MapPin className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                </AdvancedMarker>

                {/* Marker Lokasi Pengguna */}
                {userLocation && (
                  <AdvancedMarker position={userLocation} title="Lokasi Anda">
                    <div className="flex flex-col items-center">
                      <div className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow mb-1">
                        Posisi Anda
                      </div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg animate-pulse ring-4 ring-emerald-400/30" />
                    </div>
                  </AdvancedMarker>
                )}

                {/* Gambar Garis Rute */}
                {polylinePoints.length > 0 && (
                  <RoutePolyline
                    path={polylinePoints}
                    isActualRoad={routeInfo?.isActualRoad ?? false}
                  />
                )}
              </Map>
            </APIProvider>
          </div>
        </div>
      ) : (
        /* Fallback ketika koordinat belum tersedia */
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
            <MapPin className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Titik Koordinat Peta Belum Tersedia
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            Pemilik kos belum mengatur titik koordinat peta untuk properti ini. Anda tetap dapat menggunakan alamat di atas untuk mencari lokasi secara manual.
          </p>
          {address && googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Cari Alamat di Google Maps</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
