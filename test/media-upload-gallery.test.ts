import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { detectMediaType, saveUploadedFile, saveUploadedFiles } from "../src/lib/upload";
import { GET as getPropertyDetail } from "../src/app/api/properties/[id]/route";
import { POST as postAdminProperty, GET as getAdminProperties } from "../src/app/api/admin/properties/route";
import { PATCH as patchAdminProperty } from "../src/app/api/admin/properties/[id]/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

describe("Fitur Multi-Upload Media dan Galeri (Issue #88)", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("1. Upload Helper & Media Type Detection (src/lib/upload.ts)", () => {
    it("mendeteksi tipe VIDEO dengan benar berdasarkan MIME type atau ekstensi file", () => {
      expect(detectMediaType("video/mp4")).toBe("VIDEO");
      expect(detectMediaType("video/webm")).toBe("VIDEO");
      expect(detectMediaType(undefined, "tour-kamar.mp4")).toBe("VIDEO");
      expect(detectMediaType(undefined, "video-fasilitas.webm")).toBe("VIDEO");
      expect(detectMediaType(undefined, "clip.mov")).toBe("VIDEO");
    });

    it("mendeteksi tipe IMAGE untuk gambar standar atau fallback", () => {
      expect(detectMediaType("image/jpeg")).toBe("IMAGE");
      expect(detectMediaType("image/png")).toBe("IMAGE");
      expect(detectMediaType(undefined, "kamar-depan.jpg")).toBe("IMAGE");
      expect(detectMediaType(undefined, "kamar-mandi.png")).toBe("IMAGE");
      expect(detectMediaType()).toBe("IMAGE");
    });

    it("menyimpan file fisik ke folder public/uploads/properties", async () => {
      const dummyContent = "dummy image content";
      const file = new File([dummyContent], "test-kamar.jpg", { type: "image/jpeg" });

      const result = await saveUploadedFile(file, "test-properties");
      expect(result.url).toContain("/uploads/test-properties/");
      expect(result.type).toBe("IMAGE");

      // Verifikasi file fisik tersimpan
      const expectedFilePath = path.join(process.cwd(), "public", result.url);
      expect(fs.existsSync(expectedFilePath)).toBe(true);

      // Cleanup test file
      try {
        fs.unlinkSync(expectedFilePath);
      } catch {
        // ignore
      }
    });

    it("menyimpan multiple files sekaligus menggunakan saveUploadedFiles", async () => {
      const file1 = new File(["img1"], "foto1.jpg", { type: "image/jpeg" });
      const file2 = new File(["vid1"], "video1.mp4", { type: "video/mp4" });

      const results = await saveUploadedFiles([file1, file2], "test-properties-multi");
      expect(results).toHaveLength(2);
      expect(results[0].type).toBe("IMAGE");
      expect(results[1].type).toBe("VIDEO");

      // Cleanup
      for (const res of results) {
        const fp = path.join(process.cwd(), "public", res.url);
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
        }
      }
    });
  });

  describe("2. Database Schema (PropertyMedia Relation & Cascade)", () => {
    it("berhasil membuat properti dengan multiple media (IMAGE & VIDEO) dan menghapus secara cascade", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pemilik Galeri",
          whatsapp_number: "081234567888",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Galeri Indah",
          price_per_month: 1200000,
          available_rooms: 3,
          gender_type: "CAMPUR",
          facilities: "AC, WiFi",
          owner_id: owner.id,
          media: {
            create: [
              { url: "/uploads/properties/foto-1.jpg", type: "IMAGE" },
              { url: "/uploads/properties/video-tour.mp4", type: "VIDEO" },
              { url: "/uploads/properties/foto-2.jpg", type: "IMAGE" },
            ],
          },
        },
        include: { media: true },
      });

      expect(property.media).toHaveLength(3);
      expect(property.media[0].type).toBe("IMAGE");
      expect(property.media[1].type).toBe("VIDEO");
      expect(property.media[2].type).toBe("IMAGE");

      // Test cascade delete
      await prisma.property.delete({
        where: { id: property.id },
      });

      const remainingMedia = await prisma.propertyMedia.findMany({
        where: { property_id: property.id },
      });
      expect(remainingMedia).toHaveLength(0);
    });
  });

  describe("3. API Endpoints Multi-Upload & Media", () => {
    let ownerId: string;

    beforeEach(async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Galeri",
          whatsapp_number: "081987654321",
        },
      });
      ownerId = owner.id;
    });

    it("POST /api/admin/properties mendukung multipart/form-data dengan multiple media files", async () => {
      const formData = new FormData();
      formData.append("name", "Kos Multi Media");
      formData.append("price_per_month", "1500000");
      formData.append("available_rooms", "2");
      formData.append("gender_type", "PUTRI");
      formData.append("facilities", "AC, Kamar Mandi Dalam");
      formData.append("owner_id", ownerId);

      const file1 = new File(["fake image content 1"], "kamar-utama.jpg", {
        type: "image/jpeg",
      });
      const file2 = new File(["fake video content 1"], "video-tour.mp4", {
        type: "video/mp4",
      });
      formData.append("media", file1);
      formData.append("media", file2);

      const request = new NextRequest("http://localhost:3000/api/admin/properties", {
        method: "POST",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: formData,
      });

      const response = await postAdminProperty(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Kos Multi Media");
      expect(result.data.media).toBeDefined();
      expect(result.data.media).toHaveLength(2);
      expect(result.data.media.some((m: { type: string }) => m.type === "IMAGE")).toBe(true);
      expect(result.data.media.some((m: { type: string }) => m.type === "VIDEO")).toBe(true);

      // Cleanup files created
      for (const m of result.data.media) {
        const fp = path.join(process.cwd(), "public", m.url);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    });

    it("PATCH /api/admin/properties/[id] mendukung penambahan media via multipart/form-data", async () => {
      const property = await prisma.property.create({
        data: {
          name: "Kos Sebelum Update",
          price_per_month: 900000,
          available_rooms: 1,
          gender_type: "PUTRA",
          facilities: "Kasur",
          owner_id: ownerId,
        },
      });

      const formData = new FormData();
      formData.append("name", "Kos Setelah Update Media");
      const newFile = new File(["video update"], "update-tour.mp4", {
        type: "video/mp4",
      });
      formData.append("media", newFile);

      const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: formData,
      });

      const response = await patchAdminProperty(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Kos Setelah Update Media");
      expect(result.data.media).toHaveLength(1);
      expect(result.data.media[0].type).toBe("VIDEO");

      // Cleanup
      const fp = path.join(process.cwd(), "public", result.data.media[0].url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });

    it("GET /api/properties/[id] mengembalikan data media lengkap untuk galeri publik", async () => {
      const property = await prisma.property.create({
        data: {
          name: "Kos Galeri Publik",
          price_per_month: 850000,
          available_rooms: 4,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          owner_id: ownerId,
          media: {
            create: [
              { url: "/uploads/properties/foto-depan.jpg", type: "IMAGE" },
              { url: "/uploads/properties/video-kamar.mp4", type: "VIDEO" },
            ],
          },
        },
      });

      const request = new Request(`http://localhost:3000/api/properties/${property.id}`);
      const response = await getPropertyDetail(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.media).toHaveLength(2);
      expect(result.data.media[0].url).toBe("/uploads/properties/foto-depan.jpg");
      expect(result.data.media[1].type).toBe("VIDEO");
    });
  });
});
