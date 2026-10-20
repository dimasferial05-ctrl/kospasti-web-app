import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  getValidAdminToken,
  isValidAdminToken,
  isValidAdminRequest,
  createAdminUnauthorizedResponse,
} from "@/lib/admin-auth";
import { middleware } from "@/middleware";
import { GET as getBookings } from "@/app/api/admin/bookings/route";
import { POST as processPayout } from "@/app/api/admin/payouts/[id]/process/route";
import { GET as getStats } from "@/app/api/admin/stats/route";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { GET as getLocations } from "@/app/api/admin/locations/route";
import { GET as getProperties } from "@/app/api/admin/properties/route";
import { POST as generateMagicLink } from "@/app/api/magic-link/generate/route";

describe("Admin Cookie Security & Value Validation (Issue #261)", () => {
  const originalEnv = process.env.ADMIN_TOKEN;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.ADMIN_TOKEN;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_TOKEN = originalEnv;
    } else {
      delete process.env.ADMIN_TOKEN;
    }
  });

  describe("Helper: src/lib/admin-auth.ts", () => {
    it("getValidAdminToken mengembalikan token default 'kospasti_admin_authenticated' jika env tidak disetel", () => {
      delete process.env.ADMIN_TOKEN;
      expect(getValidAdminToken()).toBe("kospasti_admin_authenticated");
    });

    it("getValidAdminToken memprioritaskan nilai process.env.ADMIN_TOKEN jika disetel", () => {
      process.env.ADMIN_TOKEN = "custom_super_secret_token_123";
      expect(getValidAdminToken()).toBe("custom_super_secret_token_123");
    });

    it("isValidAdminToken hanya mengembalikan true jika token bernilai persis sama", () => {
      expect(isValidAdminToken(undefined)).toBe(false);
      expect(isValidAdminToken(null)).toBe(false);
      expect(isValidAdminToken("")).toBe(false);
      expect(isValidAdminToken("acak")).toBe(false);
      expect(isValidAdminToken("12345")).toBe(false);
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(true);

      // Dengan custom env
      process.env.ADMIN_TOKEN = "secret_env_token";
      expect(isValidAdminToken("kospasti_admin_authenticated")).toBe(false);
      expect(isValidAdminToken("secret_env_token")).toBe(true);
    });

    it("isValidAdminRequest memvalidasi NextRequest dengan cookie admin_token", () => {
      const validReq = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: { cookie: "admin_token=kospasti_admin_authenticated" },
      });
      const invalidReq = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: { cookie: "admin_token=fake_random_token" },
      });
      const emptyReq = new NextRequest("http://localhost:3000/api/admin/stats");

      expect(isValidAdminRequest(validReq)).toBe(true);
      expect(isValidAdminRequest(invalidReq)).toBe(false);
      expect(isValidAdminRequest(emptyReq)).toBe(false);
    });

    it("isValidAdminRequest memvalidasi Request standar via Cookie header", () => {
      const validReq = new Request("http://localhost:3000/api/properties/prop-1", {
        headers: { cookie: "foo=bar; admin_token=kospasti_admin_authenticated; baz=qux" },
      });
      const invalidReq = new Request("http://localhost:3000/api/properties/prop-1", {
        headers: { cookie: "foo=bar; admin_token=attacker_forged_cookie" },
      });
      const noTokenReq = new Request("http://localhost:3000/api/properties/prop-1", {
        headers: { cookie: "user_token=some_token" },
      });

      const malformedReq = new Request("http://localhost:3000/api/properties/prop-1", {
        headers: { cookie: "admin_token=%E0%A4%A" },
      });

      expect(isValidAdminRequest(validReq)).toBe(true);
      expect(isValidAdminRequest(invalidReq)).toBe(false);
      expect(isValidAdminRequest(noTokenReq)).toBe(false);
      expect(isValidAdminRequest(malformedReq)).toBe(false);
    });

    it("createAdminUnauthorizedResponse menghasilkan respons 401 JSON", async () => {
      const res = createAdminUnauthorizedResponse();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unauthorized");
    });
  });

  describe("Middleware Validation against Forged Cookie", () => {
    it("menolak akses API admin dengan cookie acak dan mengembalikan 401", () => {
      const request = new NextRequest("http://localhost:3000/api/admin/payouts", {
        headers: { cookie: "admin_token=forged_attacker_cookie" },
      });
      const response = middleware(request);
      expect(response.status).toBe(401);
    });

    it("mengalihkan akses halaman admin UI dengan cookie acak ke /admin/login", () => {
      const request = new NextRequest("http://localhost:3000/admin/bookings", {
        headers: { cookie: "admin_token=forged_attacker_cookie" },
      });
      const response = middleware(request);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("mengizinkan akses API admin jika cookie cocok dengan default atau process.env.ADMIN_TOKEN", () => {
      process.env.ADMIN_TOKEN = "production_admin_secret_999";
      const request = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: { cookie: "admin_token=production_admin_secret_999" },
      });
      const response = middleware(request);
      expect(response.status).toBe(200);
    });
  });

  describe("API Handler Direct Protection against Forged Cookie", () => {
    it("GET /api/admin/bookings menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/bookings", {
        headers: { cookie: "admin_token=random_attacker_cookie" },
      });
      const res = await getBookings(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST /api/admin/payouts/[id]/process menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/payouts/pay-1/process", {
        method: "POST",
        headers: { cookie: "admin_token=random_attacker_cookie" },
        body: JSON.stringify({ notes: "test payout" }),
      });
      const res = await processPayout(req, { params: Promise.resolve({ id: "pay-1" }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("GET /api/admin/stats menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: { cookie: "admin_token=random_attacker_cookie" },
      });
      const res = await getStats(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("GET /api/admin/users menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/users", {
        headers: { cookie: "admin_token=random_attacker_cookie" },
      });
      const res = await getUsers(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("GET /api/admin/locations menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/locations", {
        headers: { cookie: "admin_token=random_attacker_cookie" },
      });
      const res = await getLocations(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("GET /api/admin/properties menolak cookie acak dengan status 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/properties", {
        headers: { cookie: "admin_token=random_attacker_cookie" },
      });
      const res = await getProperties(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST /api/magic-link/generate menolak cookie acak dengan status 401", async () => {
      const req = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        headers: { cookie: "admin_token=random_attacker_cookie" },
        body: JSON.stringify({ ownerId: "owner-1" }),
      });
      const res = await generateMagicLink(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST /api/magic-link/generate menolak token backdoor Authorization: Bearer 778899 dengan status 401", async () => {
      const req = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 778899",
        },
        body: JSON.stringify({ ownerId: "owner-1" }),
      });
      const res = await generateMagicLink(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unauthorized");
    });

    it("POST /api/magic-link/generate menolak request tanpa autentikasi dengan status 401", async () => {
      const req = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerId: "owner-1" }),
      });
      const res = await generateMagicLink(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("POST /api/magic-link/generate lolos autentikasi admin jika cookie admin_token valid disertakan", async () => {
      const req = new Request("http://localhost:3000/api/magic-link/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "admin_token=kospasti_admin_authenticated",
        },
        body: JSON.stringify({ ownerId: "invalid-owner-id-xyz" }),
      });
      const res = await generateMagicLink(req);
      // Status bukan 401 (lolos autentikasi admin, lanjut ke pengecekan database owner)
      expect(res.status).not.toBe(401);
    });
  });
});
