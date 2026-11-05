import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface UploadedMediaResult {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export const ALLOWED_FILE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
  ".webm",
]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".mkv",
  ".avi",
  ".m4v",
  ".3gp",
]);

/**
 * Mendeteksi tipe media apakah VIDEO atau IMAGE berdasarkan MIME type atau nama file
 */
export function detectMediaType(mimeType?: string, fileName?: string): "IMAGE" | "VIDEO" {
  if (mimeType && mimeType.toLowerCase().startsWith("video/")) {
    return "VIDEO";
  }

  if (fileName) {
    const ext = path.extname(fileName).toLowerCase();
    if (VIDEO_EXTENSIONS.has(ext)) {
      return "VIDEO";
    }
  }

  return "IMAGE";
}

/**
 * Menyimpan satu file ke Supabase Storage (atau fallback lokal jika Supabase tidak terkonfigurasi)
 */
export async function saveUploadedFile(
  file: File,
  subDir = "properties"
): Promise<UploadedMediaResult> {
  // 1. Validasi batas ukuran file (maksimal 10MB)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file melebihi batas maksimal 10MB (ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`
    );
  }

  // 2. Ekstraksi dan normalisasi ekstensi file
  const originalName = file.name || "media";
  const rawExt = path.extname(originalName).toLowerCase();
  const ext = rawExt || (file.type && file.type.startsWith("video/") ? ".mp4" : ".jpg");

  // 3. Validasi ekstensi file terhadap whitelist
  if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
    throw new Error(
      `Format file '${ext}' tidak didukung. Ekstensi yang diizinkan: ${Array.from(ALLOWED_FILE_EXTENSIONS).join(", ")}`
    );
  }

  const sanitizedBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const fileName = `${sanitizedBase}-${uniqueSuffix}${ext}`;
  const mediaType = detectMediaType(file.type, originalName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "kospasti-media";

  // 4. Unggah ke Supabase Storage jika klien Supabase tersedia
  if (supabase) {
    const storagePath = `${subDir}/${fileName}`;
    const contentType = file.type || (mediaType === "VIDEO" ? "video/mp4" : "image/jpeg");

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[SUPABASE STORAGE ERROR] Gagal upload:", uploadError);
      throw new Error(`Gagal mengunggah media ke Supabase Storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return {
      url: publicUrlData.publicUrl,
      type: mediaType,
    };
  }

  // 5. Fallback ke sistem file lokal (untuk offline/testing)
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  await fs.promises.writeFile(filePath, buffer);

  const publicUrl = `/uploads/${subDir}/${fileName}`;

  return {
    url: publicUrl,
    type: mediaType,
  };
}

/**
 * Menyimpan banyak file sekaligus
 */
export async function saveUploadedFiles(
  files: File[],
  subDir = "properties"
): Promise<UploadedMediaResult[]> {
  const results: UploadedMediaResult[] = [];

  for (const file of files) {
    if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
      const saved = await saveUploadedFile(file, subDir);
      results.push(saved);
    }
  }

  return results;
}

/**
 * Menghapus file fisik dari Supabase Storage atau folder lokal (/uploads/...)
 */
export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl) {
    return false;
  }

  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "kospasti-media";

  // Kasus 1: URL Supabase Storage
  if (supabase && (fileUrl.includes("supabase.co/storage/v1/object/public/") || fileUrl.includes("/storage/v1/object/public/"))) {
    try {
      const marker = `/storage/v1/object/public/${bucketName}/`;
      if (fileUrl.includes(marker)) {
        const filePath = decodeURIComponent(fileUrl.split(marker)[1]);
        if (filePath) {
          const { error } = await supabase.storage.from(bucketName).remove([filePath]);
          if (error) {
            console.warn("[SUPABASE STORAGE DELETE ERROR]:", error);
            return false;
          }
          return true;
        }
      }
    } catch (err) {
      console.warn("[SUPABASE STORAGE DELETE ERROR]:", err);
      return false;
    }
  }

  // Kasus 2: URL file lokal (/uploads/...)
  if (fileUrl.startsWith("/uploads/")) {
    try {
      const relativePath = fileUrl.replace(/^\//, "");
      const absolutePath = path.join(process.cwd(), "public", relativePath);
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        return true;
      }
    } catch (error) {
      console.error("Gagal menghapus file fisik lokal:", fileUrl, error);
    }
  }

  return false;
}
