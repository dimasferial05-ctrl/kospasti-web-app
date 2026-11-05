import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as supabaseModule from "@/lib/supabase";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";
import fs from "fs";

describe("Supabase Storage Integration Tests (#360)", () => {
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockRemove = vi.fn();

  const mockSupabaseAdmin = {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUpload.mockReset();
    mockGetPublicUrl.mockReset();
    mockRemove.mockReset();

    // Mock getSupabaseAdmin to return mockSupabaseAdmin
    vi.spyOn(supabaseModule, "getSupabaseAdmin").mockReturnValue(
      mockSupabaseAdmin as unknown as ReturnType<typeof supabaseModule.getSupabaseAdmin>
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("berhasil mengunggah file ke Supabase Storage dan mengembalikan URL publik", async () => {
    const file = new File(["test-content"], "kamar-tidur.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 2048, configurable: true });

    mockUpload.mockResolvedValue({ data: { path: "properties/test.jpg" }, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          "https://rghnaikrurcwctqxdsjo.supabase.co/storage/v1/object/public/kospasti-media/properties/kamar-tidur-123.jpg",
      },
    });

    const result = await saveUploadedFile(file, "properties");

    expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith("kospasti-media");
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(result.url).toBe(
      "https://rghnaikrurcwctqxdsjo.supabase.co/storage/v1/object/public/kospasti-media/properties/kamar-tidur-123.jpg"
    );
    expect(result.type).toBe("IMAGE");
  });

  it("melempar error jika pengunggahan ke Supabase Storage mengalami kegagalan", async () => {
    const file = new File(["test-content"], "kamar-tidur.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 2048, configurable: true });

    mockUpload.mockResolvedValue({
      data: null,
      error: { message: "Bucket not found or permission denied" },
    });

    await expect(saveUploadedFile(file, "properties")).rejects.toThrow(
      "Gagal mengunggah media ke Supabase Storage: Bucket not found or permission denied"
    );
  });

  it("berhasil menghapus file dari Supabase Storage jika URL merupakan URL Supabase", async () => {
    const supabaseUrl =
      "https://rghnaikrurcwctqxdsjo.supabase.co/storage/v1/object/public/kospasti-media/properties/kamar-123.jpg";

    mockRemove.mockResolvedValue({ data: [{ name: "properties/kamar-123.jpg" }], error: null });

    const deleted = await deleteUploadedFile(supabaseUrl);

    expect(deleted).toBe(true);
    expect(mockSupabaseAdmin.storage.from).toHaveBeenCalledWith("kospasti-media");
    expect(mockRemove).toHaveBeenCalledWith(["properties/kamar-123.jpg"]);
  });

  it("mengembalikan false jika penghapusan dari Supabase Storage menghasilkan error", async () => {
    const supabaseUrl =
      "https://rghnaikrurcwctqxdsjo.supabase.co/storage/v1/object/public/kospasti-media/properties/kamar-123.jpg";

    mockRemove.mockResolvedValue({
      data: null,
      error: { message: "Item not found" },
    });

    const deleted = await deleteUploadedFile(supabaseUrl);

    expect(deleted).toBe(false);
  });

  it("tetap mendukung penghapusan file lokal legacy (/uploads/...) saat fallback", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs.promises, "unlink").mockResolvedValue(undefined);

    const deleted = await deleteUploadedFile("/uploads/properties/foto-lama.jpg");

    expect(deleted).toBe(true);
    expect(unlinkSpy).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan false jika URL kosong atau tidak valid", async () => {
    expect(await deleteUploadedFile("")).toBe(false);
    expect(await deleteUploadedFile("https://example.com/other-image.jpg")).toBe(false);
  });
});
