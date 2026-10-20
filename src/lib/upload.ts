import fs from "fs";
import path from "path";

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
 * Menyimpan satu file ke direktori public/uploads/properties
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

  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sanitizedBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const fileName = `${sanitizedBase}-${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(filePath, buffer);

  const mediaType = detectMediaType(file.type, originalName);
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
 * Menghapus file fisik dari folder public jika URL merupakan file lokal (/uploads/...)
 */
export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return false;
  }

  try {
    const relativePath = fileUrl.replace(/^\//, "");
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      return true;
    }
  } catch (error) {
    console.error("Gagal menghapus file fisik:", fileUrl, error);
  }

  return false;
}
