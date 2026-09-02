import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import crypto from "crypto";

describe("MagicLink Model / API", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Sukses", () => {
    it("berhasil melakukan generate token MagicLink unik beserta waktu kedaluwarsa (expires_at) untuk Owner", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner MagicLink Test",
          whatsapp_number: "628999888777",
        },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit ke depan

      const magicLink = await prisma.magicLink.create({
        data: {
          token,
          expires_at: expiresAt,
          owner_id: owner.id,
        },
      });

      expect(magicLink).toBeDefined();
      expect(magicLink.token).toBe(token);
      expect(magicLink.is_used).toBe(false);
      expect(magicLink.expires_at.getTime()).toBeGreaterThan(Date.now());
      expect(magicLink.owner_id).toBe(owner.id);
    });

    it("berhasil menggunakan token (mengubah field is_used dari false menjadi true)", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Use Token Test",
          whatsapp_number: "628777666555",
        },
      });

      const token = "valid-test-token-123";
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const createdLink = await prisma.magicLink.create({
        data: {
          token,
          expires_at: expiresAt,
          owner_id: owner.id,
        },
      });

      expect(createdLink.is_used).toBe(false);

      const usedLink = await prisma.magicLink.update({
        where: { id: createdLink.id },
        data: { is_used: true },
      });

      expect(usedLink.is_used).toBe(true);
    });
  });

  describe("Skenario Gagal (Edge Cases)", () => {
    it("gagal memvalidasi token jika nilai is_used sudah true (token sudah terpakai)", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Used Token Check",
          whatsapp_number: "628111222999",
        },
      });

      const usedToken = "already-used-token-xyz";
      await prisma.magicLink.create({
        data: {
          token: usedToken,
          expires_at: new Date(Date.now() + 30 * 60 * 1000),
          is_used: true, // Already used
          owner_id: owner.id,
        },
      });

      // Validation logic: attempting to verify/find an active valid token
      const foundLink = await prisma.magicLink.findUnique({
        where: { token: usedToken },
      });

      expect(foundLink).not.toBeNull();
      const isValid = foundLink && !foundLink.is_used && foundLink.expires_at > new Date();
      expect(isValid).toBe(false);
    });

    it("gagal memvalidasi token jika waktu saat ini sudah melewati expires_at (token expired)", async () => {
      const owner = await prisma.owner.create({
        data: {
          name: "Owner Expired Token Check",
          whatsapp_number: "628222333888",
        },
      });

      const expiredToken = "expired-token-123";
      const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 menit yang lalu

      await prisma.magicLink.create({
        data: {
          token: expiredToken,
          expires_at: pastDate,
          is_used: false,
          owner_id: owner.id,
        },
      });

      // Validation logic: checking expiration
      const foundLink = await prisma.magicLink.findUnique({
        where: { token: expiredToken },
      });

      expect(foundLink).not.toBeNull();
      const isExpired = foundLink && foundLink.expires_at < new Date();
      expect(isExpired).toBe(true);

      const isValid = foundLink && !foundLink.is_used && foundLink.expires_at > new Date();
      expect(isValid).toBe(false);
    });
  });
});
