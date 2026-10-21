import {
  COMMON_LOCATION_COORDINATES,
  findCoordinateInDictionary,
} from "@/data/coordinates";

export { COMMON_LOCATION_COORDINATES, findCoordinateInDictionary };

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
  source?: "dictionary" | "nominatim" | "google" | "cache";
}

export interface ReverseGeocodeResult {
  success: boolean;
  address: string;
  details: unknown;
  source?: "cache" | "google" | "nominatim";
  error?: string;
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

// In-Memory Cache Store
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

const reverseCache = new Map<string, CacheEntry<{ address: string; details: unknown }>>();
const forwardCache = new Map<string, CacheEntry<GeocodeResult | null>>();

export function getReverseGeocodeCacheSize(): number {
  return reverseCache.size;
}

export function clearGeocodeCache(): void {
  reverseCache.clear();
  forwardCache.clear();
}

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setToCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// Rate Limiter: Maksimal 1 request per detik ke Nominatim OSM
let lastNominatimRequestTime = 0;
let nominatimQueue: Promise<unknown> = Promise.resolve();

export async function scheduleNominatimRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const execute = async (): Promise<T> => {
    const now = Date.now();
    const elapsed = now - lastNominatimRequestTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    lastNominatimRequestTime = Date.now();
    return requestFn();
  };

  const currentRequest = nominatimQueue.then(execute, execute);
  nominatimQueue = currentRequest.then(
    () => {},
    () => {}
  );
  return currentRequest;
}

export async function reverseGeocodeCoordinate(
  lat: number,
  lng: number,
  options?: { apiKey?: string; timeoutMs?: number }
): Promise<ReverseGeocodeResult> {
  // 1. Kunci cache berbasis koordinat dibulatkan 4 desimal (~11 meter)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = getFromCache(reverseCache, cacheKey);
  if (cached) {
    return {
      success: true,
      address: cached.address,
      details: cached.details,
      source: "cache",
    };
  }

  // 2. Utamakan Google Maps jika API Key tersedia
  const apiKey =
    options?.apiKey ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=id`;
      const res = await fetch(googleUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results[0]) {
          const result = {
            address: data.results[0].formatted_address,
            details: data.results[0],
          };
          setToCache(reverseCache, cacheKey, result);
          return {
            success: true,
            address: result.address,
            details: result.details,
            source: "google",
          };
        }
      }
    } catch (err) {
      console.warn("Google reverse geocode failed, falling back to Nominatim:", err);
    }
  }

  // 3. Fallback OpenStreetMap Nominatim dengan rate limiter (maks 1 req/detik)
  try {
    const timeoutMs = options?.timeoutMs || 4000;
    const result = await scheduleNominatimRequest(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "KosPasti-App/1.0 (adminkospasti@gmail.com)",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
      const data = await res.json();
      return {
        address: (data?.display_name as string) || "",
        details: data?.address || null,
      };
    });

    if (result.address) {
      setToCache(reverseCache, cacheKey, result);
      return {
        success: true,
        address: result.address,
        details: result.details,
        source: "nominatim",
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed:", err);
  }

  return {
    success: false,
    address: "",
    details: null,
    error: "Gagal memproses reverse geocoding lokasi.",
  };
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

  // 2. Cek in-memory cache
  const cacheKey = trimmed.toLowerCase();
  const cached = getFromCache(forwardCache, cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 3. OpenStreetMap / Nominatim API (gratis) dengan rate limiting
  try {
    const nominatimResult = await scheduleNominatimRequest(async () => {
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
              name: (data[0].display_name as string) || trimmed,
              source: "nominatim" as const,
            };
          }
        }
      }
      return null;
    });

    if (nominatimResult) {
      setToCache(forwardCache, cacheKey, nominatimResult);
      return nominatimResult;
    }
  } catch (error) {
    console.warn("Geocoding Nominatim failed or timed out:", error);
  }

  // 4. Fallback Google Maps Geocoding API jika API key tersedia
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
          const googleResult: GeocodeResult = {
            lat: loc.lat,
            lng: loc.lng,
            name: data.results[0].formatted_address || trimmed,
            source: "google",
          };
          setToCache(forwardCache, cacheKey, googleResult);
          return googleResult;
        }
      }
    } catch (error) {
      console.warn("Google geocoding fallback failed:", error);
    }
  }

  return null;
}
