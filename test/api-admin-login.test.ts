import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as loginPOST, loginAttempts } from "../src/app/api/admin/login/route";
import { POST as logoutPOST } from "../src/app/api/admin/logout/route";

describe("Admin Authentication API Endpoints (/api/admin/login & /api/admin/logout)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    loginAttempts.clear();
    process.env.ADMIN_EMAIL = "adminkospasti@gmail.com";
    process.env.ADMIN_PASSWORD = "kospasti123";
  });

  describe("POST /api/admin/login", () => {
    it("mengembalikan status 500 jika ADMIN_EMAIL atau ADMIN_PASSWORD belum dikonfigurasi di environment", async () => {
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD;

      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: "adminkospasti@gmail.com",
          password: "kospasti123",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Konfigurasi autentikasi server belum lengkap.");
    });

    it("mengembalikan status 401 jika email atau password tidak dikirimkan", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email atau password salah.");
    });

    it("mengembalikan status 401 jika email atau password salah", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: "wrong@gmail.com",
          password: "wrongpassword",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email atau password salah.");
    });

    it("mengembalikan status 429 jika melebihi batas percobaan login gagal (rate limit)", async () => {
      const ip = "192.168.1.100";

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost:3000/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            email: "wrong@gmail.com",
            password: "wrongpassword",
          }),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
          },
        });
        const res = await loginPOST(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt should be blocked by rate limit
      const blockedReq = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: "adminkospasti@gmail.com",
          password: "kospasti123",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
      });

      const blockedRes = await loginPOST(blockedReq);
      const data = await blockedRes.json();

      expect(blockedRes.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Terlalu banyak percobaan login gagal");
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    });

    it("mengembalikan status 200 dan memasang cookie HTTP-Only admin_token jika email dan password benar", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: "adminkospasti@gmail.com",
          password: "kospasti123",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Login admin berhasil.");

      const cookie = response.cookies.get("admin_token");
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe("kospasti_admin_authenticated");
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.path).toBe("/");
    });
  });

  describe("POST /api/admin/logout", () => {
    it("mengembalikan status 200 dan menghapus cookie admin_token", async () => {
      const response = await logoutPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Logout admin berhasil.");

      // Cookie deletion in Next.js response
      const cookie = response.cookies.get("admin_token");
      expect(cookie?.value === "" || cookie?.maxAge === 0 || !cookie).toBe(true);
    });
  });
});
