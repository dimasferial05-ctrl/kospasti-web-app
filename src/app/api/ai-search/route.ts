import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  findPropertiesWithinRadius,
  fetchFullPropertiesByIds,
  getAllPropertiesFallback,
  DetailedPropertyWithDistance,
} from "@/lib/propertyGeospatial";

export interface AISearchResult {
  location_intent: string | null;
  target_latitude: number | null;
  target_longitude: number | null;
  max_price: number | null;
  gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null;
  facilities_keywords: string[];
  is_pet_friendly?: boolean | null;
  is_24_hours?: boolean | null;
}

import {
  COMMON_LOCATION_COORDINATES,
  findCoordinateInDictionary,
} from "@/data/coordinates";

export { COMMON_LOCATION_COORDINATES, findCoordinateInDictionary };



export async function fetchOnlineGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + ", Indonesia"
      )}&format=json&limit=1&countrycodes=id`,
      {
        headers: {
          "User-Agent": "Kospasti-AI-App/1.0",
          "Accept-Language": "id",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { lat, lng: lon };
        }
      }
    }
  } catch {
    // Abaikan jika timeout atau offline
  }
  return null;
}

export function fallbackExtractCriteria(prompt: string): AISearchResult {
  const lower = prompt.toLowerCase();

  // 1. Gender extraction
  let gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null = null;
  if (/\b(putri|cewek|wanita|perempuan)\b/i.test(lower)) {
    gender_type = "PUTRI";
  } else if (/\b(putra|cowok|pria|laki)\b/i.test(lower)) {
    gender_type = "PUTRA";
  } else if (/\b(campur|pasutri)\b/i.test(lower)) {
    gender_type = "CAMPUR";
  }

  // 2. Price extraction
  let max_price: number | null = null;
  const jtMatch = lower.match(
    /(?:di\s*bawah|maks(?:imal)?|budget|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:juta|jt)/i
  );
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(",", "."));
    if (!isNaN(num)) max_price = Math.round(num * 1000000);
  } else {
    const rbMatch = lower.match(
      /(?:di\s*bawah|maks(?:imal)?|budget|<|<=)?\s*(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|k)/i
    );
    if (rbMatch) {
      const num = parseFloat(rbMatch[1].replace(",", "."));
      if (!isNaN(num)) max_price = Math.round(num * 1000);
    } else {
      const exactMatch = lower.match(/(\d{6,8})/);
      if (exactMatch) {
        max_price = parseInt(exactMatch[1], 10);
      }
    }
  }

  // 3. Facilities keywords
  const facilities_keywords: string[] = [];
  if (/\bac\b/i.test(lower)) facilities_keywords.push("AC");
  if (/\b(wifi|wi-fi|internet)\b/i.test(lower)) facilities_keywords.push("WiFi");
  if (/\b(km\s*dalam|kamar\s*mandi\s*dalam)\b/i.test(lower))
    facilities_keywords.push("Kamar Mandi Dalam");
  if (/\b(parkir|parkiran|garasi)\b/i.test(lower)) facilities_keywords.push("Parkir");
  if (/\b(kasur|springbed|bed)\b/i.test(lower)) facilities_keywords.push("Kasur");
  if (/\b(lemari)\b/i.test(lower)) facilities_keywords.push("Lemari");
  if (/\b(dapur|pantry)\b/i.test(lower)) facilities_keywords.push("Dapur");
  if (/\b(water\s*heater|air\s*panas)\b/i.test(lower)) facilities_keywords.push("Water Heater");
  if (/\b(cctv|keamanan|satpam)\b/i.test(lower)) facilities_keywords.push("Keamanan / CCTV");

  // 4. Lifestyle extraction (Pet Friendly & 24 Hours Curfew-Free)
  let is_pet_friendly: boolean | null = null;
  if (
    /\b(pet\s*friendly|bawa\s*hewan|bawa\s*kucing|bawa\s*anjing|peliharaan|boleh\s*hewan|bawa\s*pet)\b/i.test(
      lower
    )
  ) {
    is_pet_friendly = true;
  }

  let is_24_hours: boolean | null = null;
  if (
    /\b(24\s*jam|bebas\s*jam\s*malam|akses\s*24\s*jam|tanpa\s*jam\s*malam|bebas\s*akses|gerbang\s*24\s*jam)\b/i.test(
      lower
    )
  ) {
    is_24_hours = true;
  }

  // 5. Location extraction
  let location_intent: string | null = null;
  let target_latitude: number | null = null;
  let target_longitude: number | null = null;

  const locMatch = lower.match(
    /(?:dekat|deket|sekitar|area|daerah|di)\s+([a-z0-9\s.]+?)(?=\s+(?:harga|fasilitas|ada|khusus|budget|maks|di\s*bawah|putra|putri|campur|bebas|bisa|boleh|bawa|\d|$))/i
  );
  if (locMatch && locMatch[1].trim().length > 1) {
    location_intent = locMatch[1].trim();
    const dictCoord = findCoordinateInDictionary(location_intent);
    if (dictCoord) {
      target_latitude = dictCoord.lat;
      target_longitude = dictCoord.lng;
    }
  }

  return {
    location_intent,
    target_latitude,
    target_longitude,
    max_price,
    gender_type,
    facilities_keywords,
    is_pet_friendly,
    is_24_hours,
  };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt pencarian tidak boleh kosong." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY belum dikonfigurasi pada server.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Anda adalah asisten AI cerdas untuk aplikasi pencarian kos "Kospasti".
Tugas Anda adalah mengekstrak informasi dan kriteria pencarian kos dari teks input pengguna (bahasa sehari-hari / natural language) ke dalam format JSON yang terstruktur beserta estimasi koordinat Latitude & Longitude lokasi target di Indonesia jika disebutkan.

Aturan Ekstraksi:
1. location_intent: Nama daerah, nama tempat, nama universitas, nama kantor, landmark, atau area spesifik yang dituju (misal: "Universitas Indonesia", "Polsub", "Unsub", "PT Taekwang Subang", "Monas", "Grogol", "BKT Cipinang", "UGM"). Jika tidak disebutkan lokasi tujuan, kembalikan null.
2. target_latitude: Estimasi angka Latitude geografis lokasi target tersebut di Indonesia. Jika tidak ada lokasi tujuan, kembalikan null.
3. target_longitude: Estimasi angka Longitude geografis lokasi target tersebut di Indonesia. Jika tidak ada lokasi tujuan, kembalikan null.
4. max_price: Angka batas maksimal harga sewa per bulan dalam Rupiah (number/integer). Contoh: "di bawah 2 juta" -> 2000000, "maksimal 1.5 jt" -> 1500000, "budget 800rb" -> 800000. Jika tidak disebutkan batas harga, kembalikan null.
5. gender_type: Jenis kelamin/tipe kos. Hanya boleh salah satu dari: "PUTRA", "PUTRI", "CAMPUR", atau null jika tidak spesifik.
6. facilities_keywords: Array kata kunci fasilitas yang diinginkan (contoh: ["AC", "WiFi", "Kamar Mandi Dalam", "Dapur Bersama", "Parkir Mobil"]). Jika tidak ada fasilitas spesifik yang dicari, kembalikan array kosong [].
7. is_pet_friendly: Boolean (true jika pengguna mencari kos yang memperbolehkan hewan peliharaan / kucing / anjing / pet friendly, false atau null jika tidak disebutkan).
8. is_24_hours: Boolean (true jika pengguna mencari kos bebas jam malam, akses 24 jam, atau tanpa jam malam, false atau null jika tidak disebutkan).`;

    const generateConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location_intent: {
            type: Type.STRING,
            description: "Nama tempat/daerah/kampus tujuan atau null jika tidak ada",
            nullable: true,
          },
          target_latitude: {
            type: Type.NUMBER,
            description: "Estimasi latitude lokasi tujuan di Indonesia atau null",
            nullable: true,
          },
          target_longitude: {
            type: Type.NUMBER,
            description: "Estimasi longitude lokasi tujuan di Indonesia atau null",
            nullable: true,
          },
          max_price: {
            type: Type.NUMBER,
            description: "Batas maksimal harga per bulan (dalam Rupiah) atau null",
            nullable: true,
          },
          gender_type: {
            type: Type.STRING,
            description: "Jenis kelamin/tipe kos ('PUTRA', 'PUTRI', 'CAMPUR', atau null)",
            nullable: true,
          },
          facilities_keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Daftar kata kunci fasilitas yang dicari",
          },
          is_pet_friendly: {
            type: Type.BOOLEAN,
            description: "True jika mencari kos yang memperbolehkan hewan peliharaan (kucing/anjing), null jika tidak disebutkan",
            nullable: true,
          },
          is_24_hours: {
            type: Type.BOOLEAN,
            description: "True jika mencari kos bebas jam malam / akses 24 jam, null jika tidak disebutkan",
            nullable: true,
          },
        },
        required: ["facilities_keywords"],
      },
    };

    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ];

    let outputText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: generateConfig,
        });
        if (response.text) {
          outputText = response.text;
          break;
        }
      } catch {
        console.warn(`Model ${modelName} failed or busy, trying next model...`);
      }
    }

    let parsedData: AISearchResult;

    if (outputText) {
      parsedData = JSON.parse(outputText);
    } else {
      console.warn("Semua model Gemini sedang sibuk (503/error), menggunakan fallback regex parser.");
      parsedData = fallbackExtractCriteria(prompt);
    }

    // Resolusi koordinat cerdas:
    // 1. Cek kamus spesifik berbasis Longest-Match
    if (parsedData.location_intent) {
      const dictCoord = findCoordinateInDictionary(parsedData.location_intent);
      if (dictCoord) {
        parsedData.target_latitude = dictCoord.lat;
        parsedData.target_longitude = dictCoord.lng;
      } else if (!parsedData.target_latitude || !parsedData.target_longitude) {
        // 2. Jika tidak ada di kamus dan AI belum memberikan koordinat, gunakan geocoding OpenStreetMap otomatis
        const osmCoord = await fetchOnlineGeocode(parsedData.location_intent);
        if (osmCoord) {
          parsedData.target_latitude = osmCoord.lat;
          parsedData.target_longitude = osmCoord.lng;
        }
      }
    }

    // Normalisasi gender_type jika di luar nilai yang diizinkan
    if (
      parsedData.gender_type &&
      !["PUTRA", "PUTRI", "CAMPUR"].includes(parsedData.gender_type.toUpperCase())
    ) {
      parsedData.gender_type = null;
    } else if (parsedData.gender_type) {
      parsedData.gender_type = parsedData.gender_type.toUpperCase() as
        | "PUTRA"
        | "PUTRI"
        | "CAMPUR";
    }

    // Pipa Filter Geospasial & Semantik (Issue #192)
    const { matchedProperties, candidateProperties } =
      await fetchAndFilterProperties(parsedData);

    return NextResponse.json({
      success: true,
      data: parsedData,
      properties: matchedProperties,
      total_candidates: candidateProperties.length,
      total_matches: matchedProperties.length,
      radius_km: 10,
    });
  } catch (error: unknown) {
    try {
      const { prompt } = await req.clone().json();
      if (typeof prompt === "string" && prompt.trim()) {
        const fallback = fallbackExtractCriteria(prompt);
        if (fallback.location_intent) {
          const dictCoord = findCoordinateInDictionary(fallback.location_intent);
          if (dictCoord) {
            fallback.target_latitude = dictCoord.lat;
            fallback.target_longitude = dictCoord.lng;
          } else {
            const osmCoord = await fetchOnlineGeocode(fallback.location_intent);
            if (osmCoord) {
              fallback.target_latitude = osmCoord.lat;
              fallback.target_longitude = osmCoord.lng;
            }
          }
        }
        const { matchedProperties, candidateProperties } =
          await fetchAndFilterProperties(fallback);

        return NextResponse.json({
          success: true,
          data: fallback,
          properties: matchedProperties,
          total_candidates: candidateProperties.length,
          total_matches: matchedProperties.length,
          radius_km: 10,
        });
      }
    } catch {
      // ignore
    }

    const message = error instanceof Error ? error.message : "Gagal memproses pencarian AI.";
    console.error("AI Search API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

async function fetchAndFilterProperties(criteria: AISearchResult): Promise<{
  candidateProperties: DetailedPropertyWithDistance[];
  matchedProperties: DetailedPropertyWithDistance[];
}> {
  let candidateProperties: DetailedPropertyWithDistance[] = [];
  if (
    typeof criteria.target_latitude === "number" &&
    typeof criteria.target_longitude === "number"
  ) {
    try {
      const nearbyRaw = await findPropertiesWithinRadius(
        criteria.target_latitude,
        criteria.target_longitude,
        10,
        25
      );
      candidateProperties = await fetchFullPropertiesByIds(nearbyRaw);
    } catch (err) {
      console.error("Gagal menjalankan query geospatial:", err);
      candidateProperties = await getAllPropertiesFallback(30);
    }
  } else {
    candidateProperties = await getAllPropertiesFallback(30);
  }

  let matched = candidateProperties.filter((property) => {
    if (
      criteria.gender_type &&
      property.gender_type.toUpperCase() !== criteria.gender_type.toUpperCase()
    ) {
      return false;
    }
    if (
      criteria.max_price !== null &&
      property.price_per_month > criteria.max_price
    ) {
      return false;
    }
    if (criteria.is_pet_friendly && !property.is_pet_friendly) {
      return false;
    }
    if (criteria.is_24_hours && !property.is_24_hours) {
      return false;
    }
    if (
      criteria.facilities_keywords &&
      criteria.facilities_keywords.length > 0
    ) {
      const facCombined = (
        (property.facilities || "") +
        " " +
        (property.room_types?.map((rt) => rt.facilities || "").join(" ") || "")
      ).toLowerCase();
      const matchesAny = criteria.facilities_keywords.some((kw) =>
        facCombined.includes(kw.toLowerCase().trim())
      );
      if (!matchesAny) return false;
    }
    return true;
  });

  if (matched.length === 0 && candidateProperties.length > 0) {
    matched = candidateProperties;
  }

  return {
    candidateProperties,
    matchedProperties: matched,
  };
}
