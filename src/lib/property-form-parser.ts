import { NextRequest } from "next/server";
import { saveUploadedFile, saveUploadedFiles, detectMediaType } from "@/lib/upload";

export interface ParsedRoomType {
  id?: string;
  name: string;
  price_per_month: number;
  available_rooms: number;
  facilities: string | null;
  specifications: string | null;
  image_url?: string | null;
}

export interface ParsedPropertyPayload {
  name?: string;
  price_per_month?: number | string;
  available_rooms?: number | string;
  gender_type?: string;
  facilities?: string;
  image_url?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  owner_id?: string;
  is_pet_friendly?: boolean;
  is_24_hours?: boolean;
  description?: string | null;
  rules?: string | null;
  rental_terms?: string | null;
  youtube_url?: string | null;
  room_types?: ParsedRoomType[];
  newMediaToCreate: Array<{ url: string; type: string }>;
}

/**
 * Membaca dan menstandarisasi payload properti dari request (multipart/form-data atau application/json).
 * Menangani parsing JSON room_types, pengunggahan foto/file media, dan normalisasi tipe data.
 */
export async function parsePropertyPayload(request: Request | NextRequest): Promise<ParsedPropertyPayload> {
  const contentType = request.headers.get("content-type") || "";
  const result: ParsedPropertyPayload = {
    newMediaToCreate: [],
  };

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    if (formData.has("name")) result.name = (formData.get("name") as string) ?? undefined;
    if (formData.has("price_per_month"))
      result.price_per_month = (formData.get("price_per_month") as string) ?? undefined;
    if (formData.has("available_rooms"))
      result.available_rooms = (formData.get("available_rooms") as string) ?? undefined;
    if (formData.has("gender_type"))
      result.gender_type = (formData.get("gender_type") as string) ?? undefined;
    if (formData.has("facilities"))
      result.facilities = (formData.get("facilities") as string) ?? undefined;
    if (formData.has("image_url"))
      result.image_url = (formData.get("image_url") as string) ?? null;
    if (formData.has("address"))
      result.address = (formData.get("address") as string) ?? null;
    if (formData.has("latitude"))
      result.latitude = formData.get("latitude") as string | undefined;
    if (formData.has("longitude"))
      result.longitude = formData.get("longitude") as string | undefined;
    if (formData.has("owner_id"))
      result.owner_id = (formData.get("owner_id") as string) ?? undefined;
    if (formData.has("description"))
      result.description = (formData.get("description") as string) ?? null;
    if (formData.has("rules"))
      result.rules = (formData.get("rules") as string) ?? null;
    if (formData.has("rental_terms"))
      result.rental_terms = (formData.get("rental_terms") as string) ?? null;
    if (formData.has("youtube_url"))
      result.youtube_url = (formData.get("youtube_url") as string) ?? null;
    if (formData.has("is_pet_friendly")) {
      const val = formData.get("is_pet_friendly");
      result.is_pet_friendly = val === "true" || val === "1";
    }
    if (formData.has("is_24_hours")) {
      const val = formData.get("is_24_hours");
      result.is_24_hours = val === "true" || val === "1";
    }

    if (formData.has("room_types")) {
      const raw = formData.get("room_types") as string;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          result.room_types = [];
          for (let i = 0; i < parsed.length; i++) {
            const rt = parsed[i];
            let rtImageUrl = rt.image_url ? String(rt.image_url).trim() : null;

            // Cek file foto tipe kamar yang diunggah
            const rtFile = formData.get(`room_type_file_${i}`);
            if (rtFile && typeof rtFile === "object" && "arrayBuffer" in rtFile && (rtFile as File).size > 0) {
              const saved = await saveUploadedFile(rtFile as File, "properties");
              rtImageUrl = saved.url;
            }

            result.room_types.push({
              id: rt.id ? String(rt.id) : undefined,
              name: String(rt.name || "Standar").trim(),
              price_per_month: Math.floor(Number(rt.price_per_month || 0)),
              available_rooms: Math.floor(Number(rt.available_rooms || 0)),
              facilities: rt.facilities ? String(rt.facilities).trim() : null,
              specifications: rt.specifications ? String(rt.specifications).trim() : null,
              image_url: rtImageUrl,
            });
          }
        }
      } catch (err) {
        console.warn("Gagal parsing room_types formData:", err);
      }
    }

    const filesFromMedia = formData.getAll("media");
    const filesFromFiles = formData.getAll("files");
    const allRawFiles = [...filesFromMedia, ...filesFromFiles];

    const validFiles: File[] = [];
    for (const item of allRawFiles) {
      if (item && typeof item === "object" && "arrayBuffer" in item && (item as File).size > 0) {
        validFiles.push(item as File);
      } else if (typeof item === "string" && item.trim()) {
        result.newMediaToCreate.push({
          url: item.trim(),
          type: detectMediaType(undefined, item.trim()),
        });
      }
    }

    if (validFiles.length > 0) {
      const saved = await saveUploadedFiles(validFiles);
      for (const item of saved) {
        result.newMediaToCreate.push(item);
      }
    }
  } else {
    const body = await request.json().catch(() => ({}));
    result.name = body.name;
    result.price_per_month = body.price_per_month;
    result.available_rooms = body.available_rooms;
    result.gender_type = body.gender_type;
    result.facilities = body.facilities;
    result.image_url = body.image_url;
    result.address = body.address;
    result.latitude = body.latitude;
    result.longitude = body.longitude;
    result.owner_id = body.owner_id;
    if (body.description !== undefined) result.description = body.description;
    if (body.rules !== undefined) result.rules = body.rules;
    if (body.rental_terms !== undefined) result.rental_terms = body.rental_terms;
    if (body.youtube_url !== undefined) result.youtube_url = body.youtube_url;
    if (body.is_pet_friendly !== undefined) result.is_pet_friendly = Boolean(body.is_pet_friendly);
    if (body.is_24_hours !== undefined) result.is_24_hours = Boolean(body.is_24_hours);

    if (Array.isArray(body.room_types)) {
      result.room_types = body.room_types.map((rt: {
        id?: string;
        name?: string;
        price_per_month?: number | string;
        available_rooms?: number | string;
        facilities?: string;
        specifications?: string;
        image_url?: string;
      }) => ({
        id: rt.id ? String(rt.id) : undefined,
        name: String(rt.name || "Standar").trim(),
        price_per_month: Math.floor(Number(rt.price_per_month || 0)),
        available_rooms: Math.floor(Number(rt.available_rooms || 0)),
        facilities: rt.facilities ? String(rt.facilities).trim() : null,
        specifications: rt.specifications ? String(rt.specifications).trim() : null,
        image_url: rt.image_url ? String(rt.image_url).trim() : null,
      }));
    }

    if (Array.isArray(body.media)) {
      for (const m of body.media) {
        if (typeof m === "string" && m.trim()) {
          result.newMediaToCreate.push({
            url: m.trim(),
            type: detectMediaType(undefined, m.trim()),
          });
        } else if (m && typeof m === "object" && m.url) {
          result.newMediaToCreate.push({
            url: String(m.url).trim(),
            type: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
          });
        }
      }
    }
  }

  return result;
}
