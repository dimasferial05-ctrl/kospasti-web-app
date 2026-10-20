import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import {
  saveUploadedFile,
  saveUploadedFiles,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
} from "@/lib/upload";

describe("Media Upload Security & Validation (Issue #273)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "mkdirSync").mockReturnValue(undefined as unknown as string);
    vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);
  });

  const createMockFile = (name: string, size: number, type = "image/jpeg"): File => {
    const file = new File(["a".repeat(10)], name, { type });
    // Override size property specifically for testing large or exact sizes
    Object.defineProperty(file, "size", { value: size, configurable: true });
    return file;
  };

  describe("Konstanta Keamanan", () => {
    it("ALLOWED_FILE_EXTENSIONS memuat ekstensi gambar dan video yang aman", () => {
      expect(ALLOWED_FILE_EXTENSIONS.has(".jpg")).toBe(true);
      expect(ALLOWED_FILE_EXTENSIONS.has(".jpeg")).toBe(true);
      expect(ALLOWED_FILE_EXTENSIONS.has(".png")).toBe(true);
      expect(ALLOWED_FILE_EXTENSIONS.has(".webp")).toBe(true);
      expect(ALLOWED_FILE_EXTENSIONS.has(".mp4")).toBe(true);
      expect(ALLOWED_FILE_EXTENSIONS.has(".webm")).toBe(true);

      // Pastikan ekstensi berbahaya TIDAK ada di whitelist
      expect(ALLOWED_FILE_EXTENSIONS.has(".html")).toBe(false);
      expect(ALLOWED_FILE_EXTENSIONS.has(".svg")).toBe(false);
      expect(ALLOWED_FILE_EXTENSIONS.has(".php")).toBe(false);
      expect(ALLOWED_FILE_EXTENSIONS.has(".exe")).toBe(false);
    });

    it("MAX_FILE_SIZE adalah tepat 10 MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe("Validasi Batas Ukuran File (Max 10MB)", () => {
    it("Menolak file yang melebihi batas 10MB (misal 11MB)", async () => {
      const oversizedSize = 11 * 1024 * 1024;
      const file = createMockFile("kamar-besar.jpg", oversizedSize, "image/jpeg");
      const writeFileSpy = vi.spyOn(fs.promises, "writeFile");

      await expect(saveUploadedFile(file, "properties")).rejects.toThrow(
        "Ukuran file melebihi batas maksimal 10MB"
      );
      expect(writeFileSpy).not.toHaveBeenCalled();
    });

    it("Menerima file dengan ukuran tepat di bawah atau sama dengan 10MB", async () => {
      const validSize = 10 * 1024 * 1024;
      const file = createMockFile("kamar-pas.jpg", validSize, "image/jpeg");

      const result = await saveUploadedFile(file, "properties");
      expect(result.url).toMatch(/^\/uploads\/properties\/kamar-pas-/);
      expect(result.type).toBe("IMAGE");
    });
  });

  describe("Validasi Ekstensi File Berbahaya (XSS, Malware & RCE Prevention)", () => {
    const dangerousFiles = [
      { name: "exploit.html", type: "text/html" },
      { name: "image.svg", type: "image/svg+xml" },
      { name: "shell.php", type: "application/x-php" },
      { name: "malware.exe", type: "application/x-msdownload" },
      { name: "script.js", type: "application/javascript" },
      { name: "payload.htm", type: "text/html" },
    ];

    dangerousFiles.forEach(({ name, type }) => {
      it(`Menolak file '${name}' yang berpotensi membahayakan server/klien`, async () => {
        const file = createMockFile(name, 1024, type);
        const writeFileSpy = vi.spyOn(fs.promises, "writeFile");

        await expect(saveUploadedFile(file, "properties")).rejects.toThrow(
          "tidak didukung"
        );
        expect(writeFileSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("Penerimaan Ekstensi Gambar dan Video yang Diizinkan", () => {
    const validMedia = [
      { name: "kamar.jpg", type: "image/jpeg", expectedType: "IMAGE" },
      { name: "kamar.jpeg", type: "image/jpeg", expectedType: "IMAGE" },
      { name: "denah.png", type: "image/png", expectedType: "IMAGE" },
      { name: "kamar.webp", type: "image/webp", expectedType: "IMAGE" },
      { name: "tur.mp4", type: "video/mp4", expectedType: "VIDEO" },
      { name: "tur.webm", type: "video/webm", expectedType: "VIDEO" },
    ];

    validMedia.forEach(({ name, type, expectedType }) => {
      it(`Menerima berkas valid '${name}' dan menyimpannya sebagai ${expectedType}`, async () => {
        const file = createMockFile(name, 2 * 1024 * 1024, type);
        const writeFileSpy = vi.spyOn(fs.promises, "writeFile");

        const result = await saveUploadedFile(file, "properties");

        expect(writeFileSpy).toHaveBeenCalledTimes(1);
        expect(result.type).toBe(expectedType);
        expect(result.url).toContain(`/uploads/properties/`);
      });
    });

    it("Mengabaikan perbedaan huruf besar/kecil pada ekstensi (case-insensitive)", async () => {
      const file = createMockFile("FOTO_KAMAR.JPG", 1024 * 1024, "image/jpeg");
      const result = await saveUploadedFile(file, "properties");

      expect(result.url).toMatch(/\.jpg$/);
      expect(result.type).toBe("IMAGE");
    });
  });

  describe("Batch Upload (saveUploadedFiles)", () => {
    it("Berhasil menyimpan multiple file yang seluruhnya valid", async () => {
      const files = [
        createMockFile("foto1.jpg", 1024 * 1024, "image/jpeg"),
        createMockFile("foto2.png", 1024 * 1024, "image/png"),
      ];

      const results = await saveUploadedFiles(files, "properties");
      expect(results.length).toBe(2);
      expect(results[0].type).toBe("IMAGE");
      expect(results[1].type).toBe("IMAGE");
    });

    it("Gagal dan melempar error jika salah satu file dalam batch melanggar ekstensi", async () => {
      const files = [
        createMockFile("foto1.jpg", 1024 * 1024, "image/jpeg"),
        createMockFile("hacker.svg", 1024, "image/svg+xml"),
      ];

      await expect(saveUploadedFiles(files, "properties")).rejects.toThrow(
        "tidak didukung"
      );
    });

    it("Gagal dan melempar error jika salah satu file dalam batch melebihi batas 10MB", async () => {
      const files = [
        createMockFile("foto1.jpg", 1024 * 1024, "image/jpeg"),
        createMockFile("video_raksasa.mp4", 15 * 1024 * 1024, "video/mp4"),
      ];

      await expect(saveUploadedFiles(files, "properties")).rejects.toThrow(
        "Ukuran file melebihi batas maksimal 10MB"
      );
    });
  });
});
