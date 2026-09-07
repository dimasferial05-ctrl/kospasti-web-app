import fs from "fs";
import path from "path";

export interface UploadedMediaResult {
  url: string;
  type: "IMAGE" | "VIDEO";
}

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
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const originalName = file.name || "media";
  const ext = path.extname(originalName) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
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
