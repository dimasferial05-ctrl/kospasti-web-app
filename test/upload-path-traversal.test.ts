import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { deleteUploadedFile } from "../src/lib/upload";

describe("Upload Path Traversal Protection (Issue #444)", () => {
  const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "test-security");
  const canaryRootFile = path.resolve(process.cwd(), "public", "canary-root.txt");
  const canaryEncodedFile = path.resolve(process.cwd(), "public", "canary-encoded.txt");
  const testSubdir = path.resolve(uploadsDir, "subfolder");

  beforeEach(() => {
    // Siapkan direktori pengujian
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Bersihkan file canary dan folder uji jika tersisa
    if (fs.existsSync(canaryRootFile)) {
      fs.unlinkSync(canaryRootFile);
    }
    if (fs.existsSync(canaryEncodedFile)) {
      fs.unlinkSync(canaryEncodedFile);
    }
    if (fs.existsSync(testSubdir)) {
      fs.rmdirSync(testSubdir);
    }
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  it("1. berhasil menghapus file yang sah di dalam direktori public/uploads", async () => {
    const validFile = path.resolve(uploadsDir, "valid-sample.jpg");
    fs.writeFileSync(validFile, "dummy content");
    expect(fs.existsSync(validFile)).toBe(true);

    const result = await deleteUploadedFile("/uploads/test-security/valid-sample.jpg");
    expect(result).toBe(true);
    expect(fs.existsSync(validFile)).toBe(false);
  });

  it("2. menggagalkan percobaan path traversal sederhana (../) dan melindungi file luar", async () => {
    fs.writeFileSync(canaryRootFile, "CANARY ROOT IMPORTANT CONTENT");
    expect(fs.existsSync(canaryRootFile)).toBe(true);

    const result = await deleteUploadedFile("/uploads/../canary-root.txt");
    expect(result).toBe(false);

    // Pastikan file canary sama sekali TIDAK terhapus
    expect(fs.existsSync(canaryRootFile)).toBe(true);
  });

  it("3. menggagalkan percobaan multi-level traversal (../../package.json)", async () => {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const result = await deleteUploadedFile("/uploads/../../package.json");
    expect(result).toBe(false);
    expect(fs.existsSync(packageJsonPath)).toBe(true);
  });

  it("4. menggagalkan percobaan traversal dengan Windows separator (..\\..\\)", async () => {
    const result = await deleteUploadedFile("/uploads/..\\..\\package.json");
    expect(result).toBe(false);
  });

  it("5. menggagalkan percobaan URL-encoded traversal (%2e%2e%2f)", async () => {
    fs.writeFileSync(canaryEncodedFile, "ENCODED CANARY CONTENT");
    expect(fs.existsSync(canaryEncodedFile)).toBe(true);

    const result = await deleteUploadedFile("/uploads/%2e%2e%2fcanary-encoded.txt");
    expect(result).toBe(false);
    expect(fs.existsSync(canaryEncodedFile)).toBe(true);
  });

  it("6. mencegah penghapusan jika target adalah folder/direktori, bukan file biasa", async () => {
    if (!fs.existsSync(testSubdir)) {
      fs.mkdirSync(testSubdir, { recursive: true });
    }
    expect(fs.existsSync(testSubdir)).toBe(true);

    const result = await deleteUploadedFile("/uploads/test-security/subfolder");
    expect(result).toBe(false);
    expect(fs.existsSync(testSubdir)).toBe(true);
  });

  it("7. menolak URL eksternal, string kosong, atau path tanpa prefix /uploads/", async () => {
    expect(await deleteUploadedFile("")).toBe(false);
    expect(await deleteUploadedFile("https://example.com/avatar.jpg")).toBe(false);
    expect(await deleteUploadedFile("/public/uploads/file.jpg")).toBe(false);
    expect(await deleteUploadedFile("/uploads_other/file.jpg")).toBe(false);
  });

  it("8. mengembalikan false jika file di dalam uploads tidak ditemukan", async () => {
    const result = await deleteUploadedFile("/uploads/test-security/non-existent-file-404.jpg");
    expect(result).toBe(false);
  });
});
