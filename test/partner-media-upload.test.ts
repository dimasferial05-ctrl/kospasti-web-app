import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerHandler } from "@/app/api/partner/register/route";
import { prisma } from "@/lib/prisma";
import * as uploadModule from "@/lib/upload";

describe("Partner Registration Media Upload Tests (#362)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Menolak pendaftaran jika tidak ada file media foto yang diunggah", async () => {
    const formData = new FormData();
    formData.append("name", "Mitra Pengujian");
    formData.append("email", "mitra.media@kospasti.com");
    formData.append("password", "MitraPass123");
    formData.append("whatsapp_number", "081234567890");
    formData.append("propertyName", "Kos Media Subang");
    formData.append("address", "Jl. Subang No. 123");
    formData.append("price_per_month", "500000");
    formData.append("available_rooms", "5");
    formData.append("gender_type", "CAMPUR");

    const req = new Request("http://localhost:3000/api/partner/register", {
      method: "POST",
      body: formData,
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Wajib mengunggah minimal 1 foto");
  });

  it("2. Menolak pendaftaran jika HANYA mengunggah file video tanpa ada foto sama sekali", async () => {
    const formData = new FormData();
    formData.append("name", "Mitra Pengujian");
    formData.append("email", "mitra.video@kospasti.com");
    formData.append("password", "MitraPass123");
    formData.append("whatsapp_number", "081234567891");
    formData.append("propertyName", "Kos Video Only");
    formData.append("address", "Jl. Subang No. 456");
    formData.append("price_per_month", "600000");
    formData.append("available_rooms", "3");
    formData.append("gender_type", "PUTRA");

    // Hanya kirim file video tanpa foto
    const fakeVideo = new File(["dummy-video-content"], "room-tour.mp4", { type: "video/mp4" });
    formData.append("media", fakeVideo);

    const req = new Request("http://localhost:3000/api/partner/register", {
      method: "POST",
      body: formData,
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Wajib mengunggah minimal 1 foto kamar atau kos");
  });

  it("3. Menolak pendaftaran jika email sudah terdaftar SEBELUM mengunggah ke Supabase Storage (mencegah orphaned files)", async () => {
    // Mock bahwa email sudah terdaftar di database
    vi.spyOn(prisma.owner, "findUnique").mockResolvedValue({
      id: "owner-existing",
      email: "mitra.duplikat@kospasti.com",
    } as unknown as never);

    const mockSaveUploadedFiles = vi.spyOn(uploadModule, "saveUploadedFiles");

    const formData = new FormData();
    formData.append("name", "Mitra Duplikat");
    formData.append("email", "mitra.duplikat@kospasti.com");
    formData.append("password", "MitraPass123");
    formData.append("whatsapp_number", "081234567892");
    formData.append("propertyName", "Kos Duplikat");
    formData.append("address", "Jl. Subang No. 789");
    formData.append("price_per_month", "500000");
    formData.append("available_rooms", "5");
    formData.append("gender_type", "CAMPUR");

    const fakeImage = new File(["dummy-image-content"], "kamar.jpg", { type: "image/jpeg" });
    formData.append("media", fakeImage);

    const req = new Request("http://localhost:3000/api/partner/register", {
      method: "POST",
      body: formData,
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Email ini sudah terdaftar");
    // Pastikan saveUploadedFiles TIDAK dipanggil sama sekali
    expect(mockSaveUploadedFiles).not.toHaveBeenCalled();
  });

  it("4. Berhasil mengunggah media foto & video, menyimpan ke Supabase storage & PropertyMedia, serta bebas dari Unsplash dummy URL", async () => {
    vi.spyOn(prisma.owner, "findUnique").mockResolvedValue(null);

    const mockSaveUploadedFiles = vi.spyOn(uploadModule, "saveUploadedFiles").mockResolvedValue([
      {
        url: "https://mock.supabase.co/storage/v1/object/public/properties/kos-1.jpg",
        type: "IMAGE",
      },
      {
        url: "https://mock.supabase.co/storage/v1/object/public/properties/kos-tour.mp4",
        type: "VIDEO",
      },
    ]);

    const createdOwner = { id: "owner-999", email: "mitra.media@kospasti.com" };
    const createdProperty = { id: "prop-999", name: "Kos Media Subang", image_url: "https://mock.supabase.co/storage/v1/object/public/properties/kos-1.jpg" };

    const txMock = {
      owner: {
        create: vi.fn().mockResolvedValue(createdOwner),
      },
      property: {
        create: vi.fn().mockImplementation(async (args) => {
          // Pastikan image_url adalah foto asli pertama yang diunggah, BUKAN unsplash
          expect(args.data.image_url).toBe("https://mock.supabase.co/storage/v1/object/public/properties/kos-1.jpg");
          expect(args.data.image_url).not.toContain("unsplash.com");
          return createdProperty;
        }),
      },
      propertyMedia: {
        createMany: vi.fn().mockImplementation(async (args) => {
          // Pastikan media tersimpan di tabel PropertyMedia
          expect(args.data).toHaveLength(2);
          expect(args.data[0].type).toBe("IMAGE");
          expect(args.data[1].type).toBe("VIDEO");
          return { count: 2 };
        }),
      },
    };

    vi.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) => {
      return cb(txMock);
    });

    const formData = new FormData();
    formData.append("name", "Mitra Pengujian");
    formData.append("email", "mitra.media@kospasti.com");
    formData.append("password", "MitraPass123");
    formData.append("whatsapp_number", "081234567890");
    formData.append("propertyName", "Kos Media Subang");
    formData.append("address", "Jl. Subang No. 123");
    formData.append("price_per_month", "500000");
    formData.append("available_rooms", "5");
    formData.append("gender_type", "CAMPUR");

    // Mock 1 image file & 1 video file
    const fakeImage = new File(["dummy-image-content"], "kamar.jpg", { type: "image/jpeg" });
    const fakeVideo = new File(["dummy-video-content"], "room-tour.mp4", { type: "video/mp4" });
    formData.append("media", fakeImage);
    formData.append("media", fakeVideo);

    const req = new Request("http://localhost:3000/api/partner/register", {
      method: "POST",
      body: formData,
    });

    const res = await registerHandler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockSaveUploadedFiles).toHaveBeenCalled();
    expect(txMock.propertyMedia.createMany).toHaveBeenCalled();
  });
});
