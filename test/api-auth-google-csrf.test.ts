import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GET as googleAuthGET } from "../src/app/api/auth/google/route";
import { GET as googleCallbackGET } from "../src/app/api/auth/callback/google/route";
import { prisma } from "../src/lib/prisma";
import { NextRequest } from "next/server";
import { createOAuthState, parseOAuthState } from "../src/lib/auth";

describe("Google OAuth CSRF Protection / State Nonce (Issue #410)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "mock-google-client-id.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "mock-google-client-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Helper Functions (createOAuthState & parseOAuthState)", () => {
    it("createOAuthState menghasilkan nonce UUID dan Base64URL payload yang valid", () => {
      const { state, nonce } = createOAuthState("/profil");

      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(10);

      const parsed = parseOAuthState(state);
      expect(parsed.nonce).toBe(nonce);
      expect(parsed.callbackUrl).toBe("/profil");
    });

    it("createOAuthState menolak callbackUrl berbahaya (Open Redirect) dan menurunkannya ke '/'", () => {
      const { state, nonce } = createOAuthState("//attacker.com");
      const parsed = parseOAuthState(state);

      expect(parsed.nonce).toBe(nonce);
      expect(parsed.callbackUrl).toBe("/");
    });

    it("parseOAuthState dapat mem-parsing format delimiter fallback (nonce:callbackUrl)", () => {
      const parsed = parseOAuthState("test-nonce-123:/checkout/bkg-1");
      expect(parsed.nonce).toBe("test-nonce-123");
      expect(parsed.callbackUrl).toBe("/checkout/bkg-1");
    });

    it("parseOAuthState mengembalikan nonce: null dan fallback aman jika format state legacy tanpa nonce", () => {
      const parsed = parseOAuthState("/kos/detail-123");
      expect(parsed.nonce).toBeNull();
      expect(parsed.callbackUrl).toBe("/kos/detail-123");
    });

    it("parseOAuthState mengembalikan fallback '/' jika stateParam kosong atau null", () => {
      expect(parseOAuthState(null)).toEqual({ nonce: null, callbackUrl: "/" });
      expect(parseOAuthState("")).toEqual({ nonce: null, callbackUrl: "/" });
    });
  });

  describe("2. Inisiasi OAuth (GET /api/auth/google)", () => {
    it("menyematkan state nonce kriptografis pada URL Google dan memasang cookie oauth_state HttpOnly", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/google?callbackUrl=/dashboard");
      const response = await googleAuthGET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBeDefined();

      const redirectUrl = new URL(location!);
      expect(redirectUrl.origin).toBe("https://accounts.google.com");
      expect(redirectUrl.pathname).toBe("/o/oauth2/v2/auth");

      const rawState = redirectUrl.searchParams.get("state");
      expect(rawState).toBeDefined();

      const { nonce, callbackUrl } = parseOAuthState(rawState);
      expect(callbackUrl).toBe("/dashboard");
      expect(nonce).toBeTruthy();

      // Periksa cookie oauth_state pada header response
      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("oauth_state=");
      expect(setCookie).toContain(`oauth_state=${nonce}`);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=lax");
    });
  });

  describe("3. Validasi Anti-CSRF pada Callback (GET /api/auth/callback/google)", () => {
    it("menolak akses (redirect /login?error=invalid_state) jika cookie oauth_state tidak ada", async () => {
      const { state } = createOAuthState("/profil");
      const req = new NextRequest(`http://localhost:3000/api/auth/callback/google?code=auth-code-123&state=${state}`);

      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/login?error=invalid_state");
    });

    it("menolak akses (redirect /login?error=invalid_state) jika nonce pada cookie tidak cocok dengan state (CSRF attack)", async () => {
      // Penyerang membuat state dengan nonce miliknya
      const { state } = createOAuthState("/profil");

      // Korban memiliki cookie oauth_state yang berbeda di browsernya
      const req = new NextRequest(`http://localhost:3000/api/auth/callback/google?code=auth-code-123&state=${state}`, {
        headers: {
          cookie: "oauth_state=victim-legitimate-nonce-456",
        },
      });

      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/login?error=invalid_state");
    });

    it("menolak akses jika parameter state tidak memiliki format nonce", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/callback/google?code=auth-code-123&state=/profil", {
        headers: {
          cookie: "oauth_state=some-nonce-789",
        },
      });

      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/login?error=invalid_state");
    });
  });

  describe("4. Skenario Sukses / Happy Path dengan State Nonce yang Sah", () => {
    it("berhasil memvalidasi state nonce, membuat user, menghapus cookie oauth_state, dan redirect ke callbackUrl", async () => {
      const targetPath = "/kos/kamar-vip-1";
      const { state, nonce } = createOAuthState(targetPath);

      // Mocking fetch Google OAuth token & userinfo
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === "https://oauth2.googleapis.com/token") {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-valid-google-token" }),
          };
        }
        if (url === "https://www.googleapis.com/oauth2/v2/userinfo") {
          return {
            ok: true,
            json: async () => ({
              id: "google-csrf-safe-id-1",
              email: "budi.santoso@gmail.com",
              name: "Budi Santoso",
              picture: "https://lh3.googleusercontent.com/avatar.jpg",
            }),
          };
        }
        return { ok: false };
      });
      global.fetch = mockFetch;

      // Mock prisma user findFirst & create
      vi.spyOn(prisma.user, "findFirst").mockResolvedValueOnce(null);
      vi.spyOn(prisma.user, "create").mockResolvedValueOnce({
        id: "user-budi-1",
        email: "budi.santoso@gmail.com",
        name: "Budi Santoso",
        google_id: "google-csrf-safe-id-1",
        avatar: "https://lh3.googleusercontent.com/avatar.jpg",
        whatsapp: null,
        bio: null,
        password: null,
        role: "USER",
        created_at: new Date(),
        updated_at: new Date(),
      } as never);

      const req = new NextRequest(`http://localhost:3000/api/auth/callback/google?code=valid-code-xyz&state=${state}`, {
        headers: {
          cookie: `oauth_state=${nonce}`,
        },
      });

      const res = await googleCallbackGET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe(`http://localhost:3000${targetPath}`);

      // Cookie oauth_state harus dihapus (Max-Age=0 atau Expires lampau)
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("user_token=");
      expect(setCookie).toContain("oauth_state=");
      expect(setCookie).toMatch(/oauth_state=;\s*Path=\/;\s*Expires=/i);
    });
  });
});
