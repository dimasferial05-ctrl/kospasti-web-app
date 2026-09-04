import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../src/app/api/magic-link/generate/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";

describe("POST /api/magic-link/generate", () => {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: "Bearer 778899",
  };

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika header Authorization tidak disertakan", async () => {
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: "some-owner-id" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("mengembalikan status 401 Unauthorized jika token PIN salah", async () => {
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: "some-owner-id" }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 000000",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Validasi Data & Generasi Link", () => {
    it("mengembalikan status 400 jika ownerId tidak diberikan", async () => {
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({}),
        headers: authHeaders,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("ownerId diperlukan");
    });

    it("mengembalikan status 400 jika ownerId hanya berupa whitespace", async () => {
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: "   " }),
        headers: authHeaders,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("ownerId diperlukan");
    });

    it("mengembalikan status 404 jika ownerId tidak ditemukan di database", async () => {
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: "non-existent-owner-id-999" }),
        headers: authHeaders,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Owner tidak ditemukan");
    });

    it("mengembalikan status 200 dan menghasilkan Magic Link 24 jam jika ownerId valid", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Bambang Test",
          whatsapp_number: "6281234567890",
        },
      });

      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: owner.id }),
        headers: authHeaders,
      });

      const startTime = Date.now();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.magicLink).toBeDefined();
      expect(data.magicLink).toMatch(/^http:\/\/localhost:3000\/update\/[a-f0-9]+$/);
      expect(data.expiresAt).toBeDefined();

      // Verify expiry time is roughly 24 hours from now
      const expiresAtDate = new Date(data.expiresAt);
      const expectedExpiryTime = startTime + 24 * 60 * 60 * 1000;
      expect(expiresAtDate.getTime()).toBeGreaterThanOrEqual(expectedExpiryTime - 5000);
      expect(expiresAtDate.getTime()).toBeLessThanOrEqual(expectedExpiryTime + 5000);

      // Extract token from magicLink
      const token = data.magicLink.split("/update/")[1];
      expect(token).toBeDefined();

      // Verify record in SQLite database
      const savedMagicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      expect(savedMagicLink).not.toBeNull();
      expect(savedMagicLink?.owner_id).toBe(owner.id);
      expect(savedMagicLink?.is_used).toBe(false);
    });

    it("menonaktifkan token lama yang belum digunakan saat generate token baru untuk owner yang sama", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Pak Bambang Multi Token",
          whatsapp_number: "628999111222",
        },
      });

      // Buat token pertama yang belum digunakan
      const firstToken = await prisma.magicLink.create({
        data: {
          token: "token-pertama-lama-12345",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          is_used: false,
          owner_id: owner.id,
        },
      });

      // Request pembuatan token baru
      const request = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        body: JSON.stringify({ ownerId: owner.id }),
        headers: authHeaders,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Cek bahwa token pertama sekarang telah diinvalisir (is_used = true)
      const updatedFirstToken = await prisma.magicLink.findUnique({
        where: { id: firstToken.id },
      });
      expect(updatedFirstToken?.is_used).toBe(true);

      // Cek bahwa token baru yang dihasilkan bernilai is_used = false
      const newToken = data.magicLink.split("/update/")[1];
      const savedNewToken = await prisma.magicLink.findUnique({
        where: { token: newToken },
      });
      expect(savedNewToken?.is_used).toBe(false);
    });
  });
});

