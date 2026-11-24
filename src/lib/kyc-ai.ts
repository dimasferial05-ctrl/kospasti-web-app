import { GoogleGenAI } from "@google/genai";

export interface ExtractedKYCData {
  document_type: "KTP" | "KTM" | "UNKNOWN";
  full_name: string | null;
  id_number: string | null; // NIK 16 digit atau NIM
  institution: string | null; // Nama universitas/sekolah tinggi
  is_authentic_document: boolean;
  notes: string | null;
  raw_response?: string;
}

export interface KYCMatchResult {
  confidence: number; // 0.0 - 1.0
  is_match: boolean;
  reason?: string;
}

/**
 * Menghitung kemiripan dua string nama (0.0 - 1.0) dengan normalisasi string:
 * lowercase, hilangkan tanda baca, gelar, serta periksa token/kata penyusun.
 */
export function calculateNameSimilarity(accountName: string, documentName: string): number {
  if (!accountName || !documentName) return 0.0;

  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const a = clean(accountName);
  const b = clean(documentName);

  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  // Cek apakah salah satu merupakan substring lengkap dari yang lain
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    return Math.max(0.8, minLen / maxLen);
  }

  // Token-based matching (kata per kata)
  const tokensA = a.split(" ").filter((t) => t.length > 1);
  const tokensB = b.split(" ").filter((t) => t.length > 1);

  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  let matches = 0;
  for (const token of tokensA) {
    if (tokensB.some((tb) => tb.includes(token) || token.includes(tb))) {
      matches++;
    }
  }

  const tokenScore = (2 * matches) / (tokensA.length + tokensB.length);

  // Levenshtein distance untuk perbandingan karakter
  const levDist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const levScore = 1 - levDist / maxLen;

  return Math.max(tokenScore, levScore);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Samarkan nomor identitas (NIK / NIM) untuk privasi (UU PDP)
 * Contoh: 3171012345670001 -> 317101******0001
 */
export function maskIdNumber(idNumber?: string | null): string {
  if (!idNumber) return "-";
  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) return "****";
  if (trimmed.length <= 8) {
    return trimmed.slice(0, 2) + "****" + trimmed.slice(-2);
  }
  return trimmed.slice(0, 6) + "******" + trimmed.slice(-4);
}

/**
 * Melakukan ekstraksi OCR cerdas menggunakan Gemini Multimodal (@google/genai)
 */
export async function extractIdentityCardData(
  fileBuffer: Buffer,
  mimeType: string,
  preferredDocType: "KTP" | "KTM"
): Promise<ExtractedKYCData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Mode simulasi/fallback jika API key tidak tersedia
    return {
      document_type: preferredDocType,
      full_name: "Nama Terdeteksi Otomatis",
      id_number: preferredDocType === "KTP" ? "3171012345670001" : "2100018920",
      institution: preferredDocType === "KTM" ? "Universitas Gadjah Mada" : null,
      is_authentic_document: true,
      notes: "Simulasi OCR lokal tanpa GEMINI_API_KEY",
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = fileBuffer.toString("base64");

  const systemInstruction = `Anda adalah sistem AI verifikasi dokumen identitas (KYC) resmi untuk platform penyewaan kos KosPasti di Indonesia.
Tugas Anda adalah membaca foto KTP (Kartu Tanda Penduduk) atau KTM (Kartu Tanda Mahasiswa).
Ekstrak informasi penting secara akurat dalam format JSON murni:
{
  "document_type": "KTP" | "KTM" | "UNKNOWN",
  "full_name": string | null (nama lengkap pemegang kartu, bersihkan gelar jika ada),
  "id_number": string | null (NIK 16 digit untuk KTP, atau NIM untuk KTM),
  "institution": string | null (nama universitas / institut / politeknik untuk KTM),
  "is_authentic_document": boolean (true jika menyerupai kartu identitas asli KTP/KTM RI, false jika gambar bukan KTP/KTM),
  "notes": string | null (catatan keterbacaan, misal teks buram atau jelas)
}

ATURAN:
1. Kembalikan HANYA format JSON valid tanpa tanda kutip markdown (\`\`\`json).
2. Jangan mengarang data. Jika teks buram atau tidak terbaca, beri nilai null.
3. Hati-hati membaca NIK/NIM, pastikan digit angka sesuai yang tertera.`;

  const prompt = `Periksa foto dokumen berikut. Tipe yang diharapkan: ${preferredDocType}. Ekstrak nama lengkap, NIK/NIM, dan institusi dalam format JSON yang telah ditentukan.`;

  const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const cleanedText = response.text.trim().replace(/^```json\s*/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleanedText);
        return {
          document_type: parsed.document_type || preferredDocType,
          full_name: parsed.full_name || null,
          id_number: parsed.id_number || null,
          institution: parsed.institution || null,
          is_authentic_document: Boolean(parsed.is_authentic_document),
          notes: parsed.notes || null,
          raw_response: cleanedText,
        };
      }
    } catch (err) {
      console.warn(`[KYC AI] Model ${modelName} gagal:`, err);
    }
  }

  throw new Error("Gagal mengekstrak data kartu identitas dengan AI Gemini. Pastikan foto jelas dan tidak buram.");
}
