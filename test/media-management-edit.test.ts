import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { deleteUploadedFile } from "../src/lib/upload";
import { DELETE as deleteAdminMedia } from "../src/app/api/admin/media/[id]/route";
import { PATCH as patchPropertyThumbnail } from "../src/app/api/admin/properties/[id]/thumbnail/route";
import { PATCH as patchAdminProperty } from "../src/app/api/admin/properties/[id]/route";
import { GET as getPublicProperties } from "../src/app/api/properties/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

describe("Fitur Manajemen Media di Halaman Edit Properti (Issue #93)", () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("1. Helper deleteUploadedFile (src/lib/upload.ts)", () => {
    it("menghapus file fisik lokal dengan benar dan mengembalikan true", async () => {
      const dummyDir = path.join(process.cwd(), "public", "uploads", "test-delete");
      if (!fs.existsSync(dummyDir)) {
        fs.mkdirSync(dummyDir, { recursive: true });
      }
      const dummyFile = path.join(dummyDir, "sample-to-delete.jpg");
      fs.writeFileSync(dummyFile, "dummy file content");

      expect(fs.existsSync(dummyFile)).toBe(true);

      const deleted = await deleteUploadedFile("/uploads/test-delete/sample-to-delete.jpg");
      expect(deleted).toBe(true);
      expect(fs.existsSync(dummyFile)).toBe(false);
    });

    it("mengembalikan false jika file bukan format /uploads/ atau tidak ditemukan", async () => {
      const resultExternal = await deleteUploadedFile("https://images.unsplash.com/photo-123");
      expect(resultExternal).toBe(false);

      const resultNotFound = await deleteUploadedFile("/uploads/properties/non-existent-999.jpg");
      expect(resultNotFound).toBe(false);
    });
  });

  describe("2. DELETE /api/admin/media/[id]", () => {
    let ownerId: string;

    beforeEach(async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Media Test",
          whatsapp_number: "081233445566",
        },
      });
      ownerId = owner.id;
    });

    it("menolak akses jika tidak ada token admin (401 Unauthorized)", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/media/fake-id", {
        method: "DELETE",
      });

      const response = await deleteAdminMedia(request, {
        params: Promise.resolve({ id: "fake-id" }),
      });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
    });

    it("mengembalikan 404 jika media tidak ditemukan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/media/non-existent-id", {
        method: "DELETE",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
      });

      const response = await deleteAdminMedia(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
    });

    it("berhasil menghapus media dari database dan mengupdate thumbnail properti jika perlu", async () => {
      const property = await prisma.property.create({
        data: {
          name: "Kos Hapus Media",
          price_per_month: 800000,
          available_rooms: 2,
          gender_type: "CAMPUR",
          facilities: "WiFi",
          image_url: "/uploads/properties/foto-utama.jpg",
          owner_id: ownerId,
          media: {
            create: [
              { url: "/uploads/properties/foto-utama.jpg", type: "IMAGE" },
              { url: "/uploads/properties/foto-kedua.jpg", type: "IMAGE" },
            ],
          },
        },
        include: { media: true },
      });

      const mediaToDelete = property.media[0];

      const request = new NextRequest(`http://localhost:3000/api/admin/media/${mediaToDelete.id}`, {
        method: "DELETE",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
      });

      const response = await deleteAdminMedia(request, {
        params: Promise.resolve({ id: mediaToDelete.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verifikasi media terhapus dari database
      const mediaInDb = await prisma.propertyMedia.findUnique({
        where: { id: mediaToDelete.id },
      });
      expect(mediaInDb).toBeNull();

      // Verifikasi thumbnail property otomatis dialihkan ke media kedua
      const updatedProp = await prisma.property.findUnique({
        where: { id: property.id },
      });
      expect(updatedProp?.image_url).toBe("/uploads/properties/foto-kedua.jpg");
    });
  });

  describe("3. PATCH /api/admin/properties/[id]/thumbnail", () => {
    let ownerId: string;

    beforeEach(async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Thumbnail Test",
          whatsapp_number: "081299887766",
        },
      });
      ownerId = owner.id;
    });

    it("menolak akses jika tidak ada token admin (401 Unauthorized)", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/properties/some-id/thumbnail", {
        method: "PATCH",
        body: JSON.stringify({ media_url: "/uploads/properties/new-thumb.jpg" }),
      });

      const response = await patchPropertyThumbnail(request, {
        params: Promise.resolve({ id: "some-id" }),
      });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
    });

    it("mengembalikan 400 jika body tidak mengirimkan media_url atau media_id", async () => {
      const property = await prisma.property.create({
        data: {
          name: "Kos Thumbnail Test",
          price_per_month: 750000,
          available_rooms: 1,
          gender_type: "PUTRA",
          facilities: "Kasur",
          owner_id: ownerId,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/thumbnail`, {
        method: "PATCH",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({}),
      });

      const response = await patchPropertyThumbnail(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
    });

    it("berhasil mengatur thumbnail properti dengan media_url", async () => {
      const property = await prisma.property.create({
        data: {
          name: "Kos Update Thumbnail",
          price_per_month: 900000,
          available_rooms: 3,
          gender_type: "PUTRI",
          facilities: "AC, WiFi",
          image_url: "/uploads/properties/old-thumb.jpg",
          owner_id: ownerId,
          media: {
            create: [
              { url: "/uploads/properties/old-thumb.jpg", type: "IMAGE" },
              { url: "/uploads/properties/new-target-thumb.jpg", type: "IMAGE" },
            ],
          },
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}/thumbnail`, {
        method: "PATCH",
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({ media_url: "/uploads/properties/new-target-thumb.jpg" }),
      });

      const response = await patchPropertyThumbnail(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.image_url).toBe("/uploads/properties/new-target-thumb.jpg");

      // Verifikasi di database
      const dbProp = await prisma.property.findUnique({
        where: { id: property.id },
      });
      expect(dbProp?.image_url).toBe("/uploads/properties/new-target-thumb.jpg");
    });
  });

  describe("4. Logika UI Admin Panel & Halaman Detail Kos", () => {
    it("memastikan URL upload lokal tidak dimasukkan ke input URL Gambar saat edit di admin", () => {
      const filePath = path.resolve(__dirname, "../src/app/admin/properties/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('!prop.image_url.startsWith("/uploads/")');
      expect(content).toContain("const isThumbnail = editingProperty.image_url === item.url;");
    });

    it("memastikan gambar thumbnail selalu muncul di index pertama (paling depan) pada halaman detail kos", () => {
      const filePath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("thumbIndex > 0");
      expect(content).toContain("list.unshift(thumb)");
    });
  });

  describe("5. GET /api/properties (Beranda / Listing Publik)", () => {
    it("memprioritaskan property.image_url (thumbnail terpilih) di atas media[0]", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Beranda Test",
          whatsapp_number: "081234567890",
        },
      });

      await prisma.property.create({
        data: {
          name: "Kos Thumbnail Khusus",
          price_per_month: 850000,
          available_rooms: 2,
          gender_type: "CAMPUR",
          facilities: "WiFi, Kasur",
          // User memilih foto kedua sebagai thumbnail
          image_url: "/uploads/properties/foto-kedua-thumbnail.jpg",
          owner_id: owner.id,
          media: {
            create: [
              { url: "/uploads/properties/foto-pertama.jpg", type: "IMAGE" },
              { url: "/uploads/properties/foto-kedua-thumbnail.jpg", type: "IMAGE" },
            ],
          },
        },
      });

      const response = await getPublicProperties();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].image_url).toBe("/uploads/properties/foto-kedua-thumbnail.jpg");
    });
  });

  describe("6. PATCH /api/admin/properties/[id] (Pencegahan Duplikasi Media saat Update)", () => {
    it("tidak menduplikasi media jika image_url yang dikirim sudah ada di media properti", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Deduplication Test",
          whatsapp_number: "081288776655",
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Kos Media Dedup",
          price_per_month: 1000000,
          available_rooms: 5,
          gender_type: "CAMPUR",
          facilities: "AC, TV",
          image_url: "https://example.com/img1.jpg",
          owner_id: owner.id,
          media: {
            create: [
              { url: "https://example.com/img1.jpg", type: "IMAGE" },
              { url: "https://example.com/img2.jpg", type: "IMAGE" },
            ],
          },
        },
        include: { media: true },
      });

      expect(property.media).toHaveLength(2);

      // Simulasikan submit form update edit dengan image_url yang sudah ada di media
      const request = new NextRequest(`http://localhost:3000/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({
          name: "Kos Media Dedup (Updated)",
          image_url: "https://example.com/img2.jpg",
        }),
      });

      const response = await patchAdminProperty(request, {
        params: Promise.resolve({ id: property.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      const allMedia = await prisma.propertyMedia.findMany({
        where: { property_id: property.id },
      });

      // Media tidak boleh bertambah menjadi 3 karena sudah ada di database
      expect(allMedia).toHaveLength(2);
      expect(allMedia.map((m) => m.url)).toEqual(
        expect.arrayContaining(["https://example.com/img1.jpg", "https://example.com/img2.jpg"])
      );
    });
  });
});

