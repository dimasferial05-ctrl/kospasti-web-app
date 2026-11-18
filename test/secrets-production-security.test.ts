import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getJwtSecret, getJwtSecretKey, signUserToken, verifyUserToken, signOwnerToken, verifyOwnerToken } from "@/lib/auth";
import { getValidAdminToken, isValidAdminToken } from "@/lib/admin-auth";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("Eliminasi Kerentanan Rahasia Default di Lingkungan Produksi (Issue #406)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAdminToken = process.env.ADMIN_TOKEN;

  beforeEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.ADMIN_TOKEN;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }

    if (originalAdminToken !== undefined) {
      process.env.ADMIN_TOKEN = originalAdminToken;
    } else {
      delete process.env.ADMIN_TOKEN;
    }
  });

  describe("1. Keamanan Mode Produksi (NODE_ENV === 'production')", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      delete process.env.JWT_SECRET;
      delete process.env.ADMIN_TOKEN;
    });

    it("getJwtSecret melempar fatal error jika JWT_SECRET tidak dikonfigurasi di produksi", () => {
      expect(() => getJwtSecret()).toThrowError(/FATAL: JWT_SECRET wajib dikonfigurasi/);
    });

    it("getJwtSecretKey melempar fatal error jika JWT_SECRET tidak dikonfigurasi di produksi", () => {
      expect(() => getJwtSecretKey()).toThrowError(/FATAL: JWT_SECRET wajib dikonfigurasi/);
    });

    it("signUserToken melempar fatal error jika JWT_SECRET tidak dikonfigurasi di produksi", async () => {
      await expect(
        signUserToken({
          userId: "user-123",
          email: "victim@example.com",
          name: "Victim User",
        })
      ).rejects.toThrowError(/FATAL: JWT_SECRET wajib dikonfigurasi/);
    });

    it("signOwnerToken melempar fatal error jika JWT_SECRET tidak dikonfigurasi di produksi", async () => {
      await expect(
        signOwnerToken({
          ownerId: "owner-123",
          name: "Victim Owner",
          whatsapp_number: "081234567890",
        })
      ).rejects.toThrowError(/FATAL: JWT_SECRET wajib dikonfigurasi/);
    });

    it("verifyUserToken mengembalikan null / gagal aman jika JWT_SECRET tidak dikonfigurasi di produksi", async () => {
      const result = await verifyUserToken("some.forged.token");
      expect(result).toBeNull();
    });

    it("verifyOwnerToken mengembalikan null / gagal aman jika JWT_SECRET tidak dikonfigurasi di produksi", async () => {
      const result = await verifyOwnerToken("some.forged.token");
      expect(result).toBeNull();
    });

    it("getValidAdminToken melempar fatal error jika ADMIN_TOKEN tidak dikonfigurasi di produksi", () => {
      expect(() => getValidAdminToken()).toThrowError(/FATAL: ADMIN_TOKEN wajib dikonfigurasi/);
    });

    it("isValidAdminToken menolak token default 'kospasti_admin_authenticated' di produksi jika ADMIN_TOKEN tidak disetel", () => {
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(false);
      expect(isValidAdminToken("forged_attacker_token")).toBe(false);
      expect(isValidAdminToken("")).toBe(false);
      expect(isValidAdminToken(null)).toBe(false);
      expect(isValidAdminToken(undefined)).toBe(false);
    });

    it("Middleware menolak akses rute admin (/api/admin & /admin) jika ADMIN_TOKEN tidak disetel di produksi meskipun memakai token default", () => {
      const apiReq = new NextRequest("http://localhost:3000/api/admin/bookings", {
        headers: { cookie: "admin_token=kospasti_admin_authenticated" },
      });
      const apiRes = middleware(apiReq);
      expect(apiRes.status).toBe(401);

      const uiReq = new NextRequest("http://localhost:3000/admin/properties", {
        headers: { cookie: "admin_token=kospasti_admin_authenticated" },
      });
      const uiRes = middleware(uiReq);
      expect(uiRes.status).toBe(307);
      expect(uiRes.headers.get("location")).toContain("/admin/login");
    });

    it("Berhasil menandatangani & memverifikasi JWT dan admin jika variabel lingkungan produksi disetel dengan benar", async () => {
      process.env.JWT_SECRET = "production_super_secret_jwt_key_min_32_chars_ok";
      process.env.ADMIN_TOKEN = "production_custom_admin_token_secure_999";

      expect(getJwtSecret()).toBe("production_super_secret_jwt_key_min_32_chars_ok");
      expect(getValidAdminToken()).toBe("production_custom_admin_token_secure_999");
      expect(isValidAdminToken("production_custom_admin_token_secure_999")).toBe(true);
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(false);

      const token = await signUserToken({
        userId: "prod-user-1",
        email: "prod@example.com",
        name: "Prod User",
      });
      expect(typeof token).toBe("string");

      const payload = await verifyUserToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe("prod-user-1");

      const ownerToken = await signOwnerToken({
        ownerId: "prod-owner-1",
        name: "Prod Owner",
        whatsapp_number: "081999999999",
      });
      const ownerPayload = await verifyOwnerToken(ownerToken);
      expect(ownerPayload).not.toBeNull();
      expect(ownerPayload?.ownerId).toBe("prod-owner-1");
    });
  });

  describe("2. Kenyamanan Developer Experience pada Mode Non-Produksi (development / test)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
      delete process.env.JWT_SECRET;
      delete process.env.ADMIN_TOKEN;
    });

    it("getJwtSecret mengembalikan fallback dev tanpa melempar error saat JWT_SECRET tidak disetel", () => {
      expect(getJwtSecret()).toBe("kospasti-user-jwt-secret-key-min-32-chars-secure-2026");
    });

    it("getValidAdminToken mengembalikan fallback dev tanpa melempar error saat ADMIN_TOKEN tidak disetel", () => {
      expect(getValidAdminToken()).toBe("kospasti_admin_authenticated");
    });

    it("isValidAdminToken mengizinkan token fallback dev saat ADMIN_TOKEN tidak disetel pada dev/test", () => {
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(true);
      expect(isValidAdminToken("wrong_token")).toBe(false);
    });

    it("memprioritaskan nilai kustom jika disetel pada mode dev/test", async () => {
      process.env.JWT_SECRET = "custom_dev_jwt_secret";
      process.env.ADMIN_TOKEN = "custom_dev_admin_token";

      expect(getJwtSecret()).toBe("custom_dev_jwt_secret");
      expect(getValidAdminToken()).toBe("custom_dev_admin_token");
      expect(isValidAdminToken("custom_dev_admin_token")).toBe(true);
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(false);
    });
  });
});
