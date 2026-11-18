import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GET as googleAuthGET } from "../src/app/api/auth/google/route";
import { GET as googleCallbackGET } from "../src/app/api/auth/callback/google/route";
import { prisma } from "../src/lib/prisma";
import { NextRequest } from "next/server";
import { createOAuthState, parseOAuthState } from "../src/lib/auth";

describe("Google OAuth API Endpoints", () => {
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

  describe("GET /api/auth/google", () => {
    it("mengembalikan status 500 jika GOOGLE_CLIENT_ID belum dikonfigurasi", async () => {
      delete process.env.GOOGLE_CLIENT_ID;

      const request = new NextRequest("http://localhost:3000/api/auth/google");
      const response = await googleAuthGET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Google OAuth belum dikonfigurasi");
    });

    it("melakukan redirect ke URL consent Google OAuth dengan parameter yang sesuai", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/google?callbackUrl=/kos/123");
      const response = await googleAuthGET(request);

      expect(response.status).toBe(307); // Redirect status
      const location = response.headers.get("location");
      expect(location).toBeDefined();

      const redirectUrl = new URL(location!);
      expect(redirectUrl.origin).toBe("https://accounts.google.com");
      expect(redirectUrl.pathname).toBe("/o/oauth2/v2/auth");
      expect(redirectUrl.searchParams.get("client_id")).toBe("mock-google-client-id.apps.googleusercontent.com");
      expect(redirectUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/callback/google");
      expect(redirectUrl.searchParams.get("response_type")).toBe("code");
      expect(redirectUrl.searchParams.get("scope")).toBe("openid email profile");

      const { callbackUrl, nonce } = parseOAuthState(redirectUrl.searchParams.get("state"));
      expect(callbackUrl).toBe("/kos/123");
      expect(nonce).toBeTruthy();

      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("oauth_state=");
      expect(setCookie).toContain("HttpOnly");
    });
  });

  describe("GET /api/auth/callback/google", () => {
    it("mengarahkan ke /login?error=oauth_cancelled jika pengguna membatalkan otorisasi", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/callback/google?error=access_denied");
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login?error=oauth_cancelled");
    });

    it("mengarahkan ke /login?error=missing_code jika parameter code tidak ada", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/callback/google");
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login?error=missing_code");
    });

    it("berhasil membuat pengguna baru dan memasang cookie user_token saat pendaftaran via Google", async () => {
      const { state, nonce } = createOAuthState("/kos/123");

      // Mock exchange code for token
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockImplementation(async (url: string) => {
        if (url === "https://oauth2.googleapis.com/token") {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-access-token" }),
          };
        }
        if (url === "https://www.googleapis.com/oauth2/v2/userinfo") {
          return {
            ok: true,
            json: async () => ({
              id: "google-uid-999",
              email: "mahasiswa.baru@gmail.com",
              name: "Mahasiswa Baru",
              picture: "https://lh3.googleusercontent.com/photo.jpg",
            }),
          };
        }
        return { ok: false };
      });

      const mockCreatedUser = {
        id: "user-id-999",
        name: "Mahasiswa Baru",
        email: "mahasiswa.baru@gmail.com",
        google_id: "google-uid-999",
        avatar: "https://lh3.googleusercontent.com/photo.jpg",
        whatsapp: null,
        bio: null,
        password: null,
        role: "USER",
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(prisma.user, "findFirst").mockResolvedValueOnce(null);
      const createSpy = vi.spyOn(prisma.user, "create").mockResolvedValueOnce(mockCreatedUser as never);

      const request = new NextRequest(
        `http://localhost:3000/api/auth/callback/google?code=valid-auth-code&state=${state}`,
        {
          headers: {
            cookie: `oauth_state=${nonce}`,
          },
        }
      );
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/kos/123");

      // Verifikasi cookie user_token terpasang
      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toContain("user_token=");
      expect(cookieHeader).toContain("HttpOnly");

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: "Mahasiswa Baru",
          email: "mahasiswa.baru@gmail.com",
          google_id: "google-uid-999",
          avatar: "https://lh3.googleusercontent.com/photo.jpg",
        },
      });
    });

    it("berhasil login dan menautkan google_id pada pengguna yang sudah terdaftar sebelumnya", async () => {
      const { state, nonce } = createOAuthState("/");

      const existingUser = {
        id: "user-lama-123",
        name: "User Lama",
        email: "user.lama@gmail.com",
        password: "hashedpassword123",
        whatsapp: "081234567890",
        avatar: null,
        bio: null,
        google_id: null,
        role: "USER",
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(prisma.user, "findFirst").mockResolvedValueOnce(existingUser as never);
      const updateSpy = vi.spyOn(prisma.user, "update").mockResolvedValueOnce({
        ...existingUser,
        google_id: "google-uid-888",
        avatar: "https://lh3.googleusercontent.com/photo-lama.jpg",
      } as never);

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockImplementation(async (url: string) => {
        if (url === "https://oauth2.googleapis.com/token") {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-access-token" }),
          };
        }
        if (url === "https://www.googleapis.com/oauth2/v2/userinfo") {
          return {
            ok: true,
            json: async () => ({
              id: "google-uid-888",
              email: "user.lama@gmail.com",
              name: "User Lama Google",
              picture: "https://lh3.googleusercontent.com/photo-lama.jpg",
            }),
          };
        }
        return { ok: false };
      });

      const request = new NextRequest(
        `http://localhost:3000/api/auth/callback/google?code=valid-code-2&state=${state}`,
        {
          headers: {
            cookie: `oauth_state=${nonce}`,
          },
        }
      );
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "user-lama-123" },
        data: {
          google_id: "google-uid-888",
          avatar: "https://lh3.googleusercontent.com/photo-lama.jpg",
        },
      });
    });
  });
});
