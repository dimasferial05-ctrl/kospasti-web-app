import {
  COMMON_LOCATION_COORDINATES,
  findCoordinateInDictionary,
} from "@/app/api/ai-search/route";

export { COMMON_LOCATION_COORDINATES, findCoordinateInDictionary };

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
  source?: "dictionary" | "nominatim" | "google";
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  return Math.round(R * c * 10) / 10;
}

export async function geocodeLocation(
  query: string,
  options?: { apiKey?: string; timeoutMs?: number }
): Promise<GeocodeResult | null> {
  const trimmed = query?.trim();
  if (!trimmed) return null;

  // 1. Cek kamus lokal koordinat asli terlebih dahulu (sangat cepat & akurat)
  const dictMatch = findCoordinateInDictionary(trimmed);
  if (dictMatch) {
    return {
      lat: dictMatch.lat,
      lng: dictMatch.lng,
      name: trimmed,
      source: "dictionary",
    };
  }

  // 2. OpenStreetMap / Nominatim API (gratis)
  try {
    const timeoutMs = options?.timeoutMs || 3000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed + ", Indonesia"
    )}&format=json&limit=1&countrycodes=id`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "KosPasti-App/1.0 (contact@kospasti.com)",
        "Accept-Language": "id",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            lat,
            lng: lon,
            name: data[0].display_name || trimmed,
            source: "nominatim",
          };
        }
      }
    }
  } catch (error) {
    // Graceful error handling (timeout / offline / network error)
    console.warn("Geocoding Nominatim failed or timed out:", error);
  }

  // 3. Fallback Google Maps Geocoding API jika API key tersedia
  const apiKey =
    options?.apiKey ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        trimmed
      )}&region=id&key=${apiKey}`;

      const res = await fetch(googleUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results[0]) {
          const loc = data.results[0].geometry.location;
          return {
            lat: loc.lat,
            lng: loc.lng,
            name: data.results[0].formatted_address || trimmed,
            source: "google",
          };
        }
      }
    } catch (error) {
      console.warn("Google geocoding fallback failed:", error);
    }
  }

  return null;
}
