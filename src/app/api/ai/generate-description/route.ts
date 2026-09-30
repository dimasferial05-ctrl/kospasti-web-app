import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function cleanPlainText(text: string): string {
  return text
    // Hapus markdown bold/italic/underline/strikethrough
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    // Hapus markdown heading
    .replace(/^#+\s+/gm, "")
    // Hapus bullet point markdown di awal baris
    .replace(/^\s*[-*•]\s+/gm, "")
    // Hapus karakter emoji
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    // Rapikan spasi dan baris ganda
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fallbackDescriptionTemplate(params: {
  name?: string;
  facilities?: string;
  price_per_month?: number | string;
  gender_type?: string;
  address?: string;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  rules?: string;
  rental_terms?: string;
  room_types?: Array<{ name?: string; price_per_month?: number | string; facilities?: string; specifications?: string }>;
}): string {
  const {
    name = "Kos Nyaman",
    facilities = "WiFi, Kasur, Lemari",
    price_per_month = 0,
    gender_type = "CAMPUR",
    address = "lokasi yang strategis",
    is_pet_friendly = false,
    is_24_hours = false,
    rules = "",
    rental_terms = "",
    room_types = [],
  } = params;

  const formattedPrice = Number(price_per_month)
    ? `Rp ${Number(price_per_month).toLocaleString("id-ID")}`
    : "harga terjangkau";

  const genderLabel =
    gender_type === "PUTRA"
      ? "khusus putra"
      : gender_type === "PUTRI"
      ? "khusus putri"
      : "campur";

  const hourText = is_24_hours
    ? " Properti ini menyediakan akses bebas 24 jam sehingga penghuni dapat beraktivitas dengan leluasa tanpa batasan jam malam."
    : "";

  const petText = is_pet_friendly
    ? " Kos ini juga ramah terhadap hewan peliharaan."
    : "";

  const rulesText = rules.trim()
    ? " Demi kenyamanan bersama, penghuni diharapkan selalu menjaga kebersihan dan menaati tata tertib lingkungan kos."
    : "";

  const termsText = rental_terms.trim()
    ? " Pengajuan sewa dapat dilakukan dengan melengkapi berkas identitas dan persyaratan yang telah ditentukan."
    : "";

  const roomTypesText =
    room_types && room_types.length > 1
      ? ` Tersedia beberapa pilihan tipe kamar yang dapat disesuaikan dengan kebutuhan dan preferensi kenyamanan Anda.`
      : "";

  return `${name} merupakan hunian kos ${genderLabel} yang berlokasi di ${address}. Hunian ini menawarkan suasana yang nyaman, bersih, dan strategis sehingga sangat ideal untuk mahasiswa maupun pekerja yang beraktivitas di sekitar wilayah ini.${roomTypesText}

Fasilitas umum dan kamar yang tersedia meliputi ${facilities}. Biaya sewa ditawarkan mulai dari ${formattedPrice} per bulan dengan fasilitas yang siap menunjang kebutuhan istirahat serta produktivitas harian Anda.${hourText}${petText}

${rulesText}${termsText} Informasi lengkap mengenai ketersediaan kamar serta pemesanan dapat dilakukan secara langsung dan praktis melalui platform KosPasti.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      facilities,
      price_per_month,
      gender_type,
      address,
      is_pet_friendly,
      is_24_hours,
      rules,
      rental_terms,
      room_types,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallbackDesc = fallbackDescriptionTemplate({
        name,
        facilities: typeof facilities === "string" ? facilities : Array.isArray(facilities) ? facilities.join(", ") : "",
        price_per_month,
        gender_type,
        address,
        is_pet_friendly,
        is_24_hours,
        rules,
        rental_terms,
        room_types,
      });

      return NextResponse.json({
        success: true,
        description: cleanPlainText(fallbackDesc),
        source: "fallback",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let roomTypesSummary = "";
    if (Array.isArray(room_types) && room_types.length > 0) {
      roomTypesSummary = room_types
        .map(
          (rt: { name?: string; price_per_month?: number | string; facilities?: string; specifications?: string }) =>
            `${rt.name || "Kamar"}: Rp ${Number(rt.price_per_month || 0).toLocaleString("id-ID")}/bln (Fasilitas: ${rt.facilities || "-"}, Spesifikasi: ${rt.specifications || "-"})`
        )
        .join("; ");
    }

    const systemInstruction = `Anda adalah asisten cerdas penulis deskripsi properti kos untuk platform KosPasti di Indonesia.
Tugas Anda adalah menganalisis seluruh data properti kos yang diberikan (tipe kos, lokasi, harga, fasilitas umum, tipe kamar, kebijakan jam malam/hewan, tata tertib, dan syarat sewa) lalu menyusun deskripsi promosi yang mengalir natural, profesional, dan persuasif dalam 2 sampai 3 paragraf teks polos biasa.

ATURAN SANGAT PENTING (DILARANG KERAS):
1. JANGAN gunakan emoji atau ikon apa pun.
2. JANGAN gunakan format Markdown sama sekali: TIDAK BOLEH ada bold (**teks**), TIDAK BOLEH ada italic (*teks* atau _teks_), TIDAK BOLEH ada heading (#), dan TIDAK BOLEH ada bullet point (* atau -).
3. Seluruh output WAJIB berupa teks kalimat dan paragraf biasa (plain text paragraphs) yang dipisahkan baris baru.
4. Jangan hanya mengulang daftar mentah, tetapi integrasikan semua poin penting menjadi narasi kalimat yang enak dibaca.
5. Gunakan bahasa Indonesia yang baik, lugas, dan profesional.`;

    const userPrompt = `Analisis seluruh data properti kos berikut dan susunlah deskripsi promosi yang lengkap dan menarik dalam paragraf biasa (tanpa emotikon, tanpa tanda tebal/bold, tanpa miring/italic, tanpa simbol poin):
- Nama Kos: ${name || "Kos Nyaman"}
- Kategori Kos: ${gender_type || "Campur"}
- Lokasi / Alamat Lengkap: ${address || "Strategis"}
- Harga Sewa: ${price_per_month ? "Mulai dari Rp " + Number(price_per_month).toLocaleString("id-ID") + " per bulan" : "Terjangkau"}
- Fasilitas Umum: ${typeof facilities === "string" ? facilities : Array.isArray(facilities) ? facilities.join(", ") : "Lengkap"}
${roomTypesSummary ? `- Rincian Tipe Kamar: ${roomTypesSummary}\n` : ""}- Ramah Hewan Peliharaan: ${is_pet_friendly ? "Ya (Pet Friendly)" : "Tidak"}
- Akses Bebas 24 Jam: ${is_24_hours ? "Ya (Bebas jam malam)" : "Ada jam malam"}
${rules ? `- Tata Tertib & Peraturan: ${rules}\n` : ""}${rental_terms ? `- Syarat & Ketentuan Sewa: ${rental_terms}\n` : ""}`;

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let generatedText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });
        if (response.text) {
          generatedText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} gagal, mencoba model alternatif...`, err);
      }
    }

    if (!generatedText) {
      generatedText = fallbackDescriptionTemplate({
        name,
        facilities: typeof facilities === "string" ? facilities : Array.isArray(facilities) ? facilities.join(", ") : "",
        price_per_month,
        gender_type,
        address,
        is_pet_friendly,
        is_24_hours,
        rules,
        rental_terms,
        room_types,
      });
    }

    const finalDescription = cleanPlainText(generatedText);

    return NextResponse.json({
      success: true,
      description: finalDescription,
      source: "gemini",
    });
  } catch (error) {
    console.error("Gagal generate deskripsi AI:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat membuat deskripsi dengan AI.",
      },
      { status: 500 }
    );
  }
}
