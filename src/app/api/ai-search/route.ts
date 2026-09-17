import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export interface AISearchResult {
  location_intent: string | null;
  target_latitude: number | null;
  target_longitude: number | null;
  max_price: number | null;
  gender_type: "PUTRA" | "PUTRI" | "CAMPUR" | null;
  facilities_keywords: string[];
}

const COMMON_LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Jakarta & Sekitarnya (Jabodetabek)
  "monas": { lat: -6.1754, lng: 106.8272 },
  "jakarta pusat": { lat: -6.1805, lng: 106.8284 },
  "jakarta selatan": { lat: -6.2615, lng: 106.8106 },
  "jakarta timur": { lat: -6.2250, lng: 106.9004 },
  "jakarta barat": { lat: -6.1683, lng: 106.7589 },
  "jakarta utara": { lat: -6.1384, lng: 106.8640 },
  "tebet": { lat: -6.2374, lng: 106.8526 },
  "cipinang": { lat: -6.2208, lng: 106.8833 },
  "bkt": { lat: -6.2260, lng: 106.9020 },
  "bkt cipinang": { lat: -6.2260, lng: 106.9020 },
  "grogol": { lat: -6.1674, lng: 106.7881 },
  "sudirman": { lat: -6.2088, lng: 106.8227 },
  "kuningan": { lat: -6.2297, lng: 106.8295 },
  "gandaria": { lat: -6.2443, lng: 106.7835 },
  "gandaria city": { lat: -6.2443, lng: 106.7835 },
  "depok": { lat: -6.4025, lng: 106.7942 },
  "universitas indonesia": { lat: -6.3650, lng: 106.8317 },
  "ui": { lat: -6.3650, lng: 106.8317 },
  "gunadarma": { lat: -6.3688, lng: 106.8335 },
  "bekasi": { lat: -6.2383, lng: 106.9756 },
  "cikarang": { lat: -6.3039, lng: 107.1537 },
  "bogor": { lat: -6.5971, lng: 106.8060 },
  "ipb": { lat: -6.5599, lng: 106.7269 },
  "ipb dramaga": { lat: -6.5599, lng: 106.7269 },
  "cibinong": { lat: -6.4816, lng: 106.8541 },

  // Wilayah Bandung Raya & Kampus
  "bandung": { lat: -6.9175, lng: 107.6191 },
  "kota bandung": { lat: -6.9175, lng: 107.6191 },
  "kabupaten bandung": { lat: -7.0253, lng: 107.5198 },
  "bandung barat": { lat: -6.8427, lng: 107.5027 },
  "cimahi": { lat: -6.8723, lng: 107.5420 },
  "itb": { lat: -6.8915, lng: 107.6107 },
  "itb ganesha": { lat: -6.8915, lng: 107.6107 },
  "itb jatinangor": { lat: -6.9304, lng: 107.7712 },
  "unpad": { lat: -6.9263, lng: 107.7747 },
  "unpad jatinangor": { lat: -6.9263, lng: 107.7747 },
  "unpad dipatiukur": { lat: -6.8943, lng: 107.6166 },
  "jatinangor": { lat: -6.9318, lng: 107.7758 },
  "sumedang": { lat: -6.8584, lng: 107.9197 },
  "telkom university": { lat: -6.9730, lng: 107.6304 },
  "tel-u": { lat: -6.9730, lng: 107.6304 },
  "dayeuhkolot": { lat: -6.9856, lng: 107.6256 },
  "upi": { lat: -6.8604, lng: 107.5900 },
  "uin bandung": { lat: -6.9284, lng: 107.7176 },
  "unpar": { lat: -6.8741, lng: 107.6047 },
  "dago": { lat: -6.8784, lng: 107.6173 },
  "dipatiukur": { lat: -6.8943, lng: 107.6166 },
  "buah batu": { lat: -6.9538, lng: 107.6369 },

  // Kampus & Perguruan Tinggi di Subang
  "polsub cibogo": { lat: -6.5683, lng: 107.8347 },
  "polsub": { lat: -6.5411, lng: 107.7719 },
  "politeknik negeri subang": { lat: -6.5411, lng: 107.7719 },
  "unsub": { lat: -6.5592, lng: 107.7656 },
  "universitas subang": { lat: -6.5592, lng: 107.7656 },
  "stiesa subang": { lat: -6.5639, lng: 107.7592 },
  "stiesa": { lat: -6.5639, lng: 107.7592 },
  "stie sutaatmadja": { lat: -6.5639, lng: 107.7592 },
  "stikes subang": { lat: -6.5583, lng: 107.7639 },
  "universitas mandiri subang": { lat: -6.5681, lng: 107.7567 },
  "stmik subang": { lat: -6.5681, lng: 107.7567 },
  "stkip subang": { lat: -6.5567, lng: 107.7619 },
  "akper subang": { lat: -6.5611, lng: 107.7628 },

  // Pabrik & Kawasan Industri di Subang
  "taekwang subang": { lat: -6.5789, lng: 107.8042 },
  "pt taekwang": { lat: -6.5789, lng: 107.8042 },
  "taekwang": { lat: -6.5789, lng: 107.8042 },
  "dahana subang": { lat: -6.5447, lng: 107.8189 },
  "pt dahana": { lat: -6.5447, lng: 107.8189 },
  "dahana": { lat: -6.5447, lng: 107.8189 },
  "handsome subang": { lat: -6.5053, lng: 107.6083 },
  "pt handsome": { lat: -6.5053, lng: 107.6083 },
  "daenong subang": { lat: -6.5719, lng: 107.7019 },
  "pt daenong": { lat: -6.5719, lng: 107.7019 },
  "daenong": { lat: -6.5719, lng: 107.7019 },
  "pungkook subang": { lat: -6.5292, lng: 107.6747 },
  "pt pungkook": { lat: -6.5292, lng: 107.6747 },
  "pungkook": { lat: -6.5292, lng: 107.6747 },
  "pirelli subang": { lat: -6.5217, lng: 107.6853 },
  "pt evoluzione": { lat: -6.5217, lng: 107.6853 },
  "evoluzione tyres": { lat: -6.5217, lng: 107.6853 },
  "subang smartpolitan": { lat: -6.4958, lng: 107.6322 },
  "suryacipta subang": { lat: -6.4958, lng: 107.6322 },
  "kawasan industri subang": { lat: -6.4958, lng: 107.6322 },
  "pt taifa": { lat: -6.5028, lng: 107.6111 },
  "pt sungwon": { lat: -6.4636, lng: 107.6897 },
  "pt shine jaya": { lat: -6.4524, lng: 107.7884 },
  "pt morich": { lat: -6.5719, lng: 107.7019 },

  // Wilayah Subang Kecamatan & Area
  "alun-alun subang": { lat: -6.5689, lng: 107.7617 },
  "subang kota": { lat: -6.5716, lng: 107.7587 },
  "kalijati": { lat: -6.5292, lng: 107.6747 },
  "pagaden barat": { lat: -6.4489, lng: 107.7392 },
  "pagaden": { lat: -6.4524, lng: 107.7884 },
  "pamanukan": { lat: -6.2844, lng: 107.8136 },
  "jalancagak": { lat: -6.6783, lng: 107.6833 },
  "ciater": { lat: -6.7408, lng: 107.6528 },
  "cipeundeuy": { lat: -6.5053, lng: 107.6083 },
  "dawuan": { lat: -6.5719, lng: 107.7019 },
  "purwadadi": { lat: -6.4636, lng: 107.6897 },
  "cibogo": { lat: -6.5683, lng: 107.8347 },
  "ciasem": { lat: -6.3314, lng: 107.6978 },
  "blanakan": { lat: -6.2575, lng: 107.6631 },
  "pelabuhan patimban": { lat: -6.2411, lng: 107.9042 },
  "patimban": { lat: -6.2411, lng: 107.9042 },
  "tanjungsiang": { lat: -6.7328, lng: 107.7972 },
  "kasomalang": { lat: -6.6978, lng: 107.7347 },
  "sagalaherang": { lat: -6.6636, lng: 107.6256 },
  "serangpanjang": { lat: -6.6492, lng: 107.5758 },
  "subang": { lat: -6.5716, lng: 107.7587 },

  // Wilayah Jawa Barat Lainnya (Kota & Kabupaten)
  "sukabumi": { lat: -6.9277, lng: 106.9298 },
  "cianjur": { lat: -6.8173, lng: 107.1396 },
  "karawang": { lat: -6.3042, lng: 107.3075 },
  "unsika": { lat: -6.3263, lng: 107.3041 },
  "purwakarta": { lat: -6.5569, lng: 107.4431 },
  "cirebon": { lat: -6.7320, lng: 108.5523 },
  "ugj cirebon": { lat: -6.7092, lng: 108.5472 },
  "indramayu": { lat: -6.3275, lng: 108.3200 },
  "majalengka": { lat: -6.8361, lng: 108.2274 },
  "kuningan jabar": { lat: -6.9764, lng: 108.4839 },
  "garut": { lat: -7.2274, lng: 107.9087 },
  "tasikmalaya": { lat: -7.3274, lng: 108.2207 },
  "unsil": { lat: -7.3486, lng: 108.2144 },
  "ciamis": { lat: -7.3258, lng: 108.3533 },
  "banjar": { lat: -7.3685, lng: 108.5327 },
  "pangandaran": { lat: -7.7028, lng: 108.4947 },

  // Kampus & Kota Populer Nasional (Jawa & Lainnya)
  "ugm": { lat: -7.7713, lng: 110.3778 },
  "universitas gadjah mada": { lat: -7.7713, lng: 110.3778 },
  "yogyakarta": { lat: -7.7956, lng: 110.3695 },
  "jogja": { lat: -7.7956, lng: 110.3695 },
  "undip": { lat: -7.0506, lng: 110.4385 },
  "semarang": { lat: -6.9667, lng: 110.4167 },
  "unair": { lat: -7.2683, lng: 112.7844 },
  "its": { lat: -7.2797, lng: 112.7975 },
  "surabaya": { lat: -7.2575, lng: 112.7521 },
  "ub": { lat: -7.9526, lng: 112.6144 },
  "malang": { lat: -7.9666, lng: 112.6326 },
};

function findCoordinateInDictionary(locationName: string): { lat: number; lng: number } | null {
  const locLower = locationName.toLowerCase().trim();

  // Sort keys by descending length so "polsub" or "taekwang subang" matches before "subang"
  const sortedKeys = Object.keys(COMMON_LOCATION_COORDINATES).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const wordBoundaryRegex = new RegExp(`(^|\\s|\\b)${escaped}(\\b|\\s|$)`, "i");
    if (wordBoundaryRegex.test(locLower) || locLower === key || locLower.includes(key)) {
      return COMMON_LOCATION_COORDINATES[key];
    }
  }
  return null;
}

async function fetchOnlineGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
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

function fallbackExtractCriteria(prompt: string): AISearchResult {
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
  if (/\b(dapur)\b/i.test(lower)) facilities_keywords.push("Dapur");
  if (/\b(water\s*heater)\b/i.test(lower)) facilities_keywords.push("Water Heater");

  // 4. Location extraction
  let location_intent: string | null = null;
  let target_latitude: number | null = null;
  let target_longitude: number | null = null;

  const locMatch = lower.match(
    /(?:dekat|deket|sekitar|area|daerah|di)\s+([a-z0-9\s.]+?)(?=\s+(?:harga|fasilitas|ada|khusus|budget|maks|di\s*bawah|putra|putri|campur|\d|$))/i
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
6. facilities_keywords: Array kata kunci fasilitas yang diinginkan (contoh: ["AC", "WiFi", "Kamar Mandi Dalam", "Parkir Mobil"]). Jika tidak ada fasilitas spesifik yang dicari, kembalikan array kosong [].`;

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

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: unknown) {
    try {
      const { prompt } = await req.clone().json();
      if (typeof prompt === "string" && prompt.trim()) {
        const fallback = fallbackExtractCriteria(prompt);
        return NextResponse.json({
          success: true,
          data: fallback,
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
