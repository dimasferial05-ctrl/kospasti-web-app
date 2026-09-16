import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GET as googleAuthGET } from "../src/app/api/auth/google/route";
import { GET as googleCallbackGET } from "../src/app/api/auth/callback/google/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";
import { verifyUserToken } from "../src/lib/auth";

describe("Google OAuth API Endpoints", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    await clearDatabase();
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
      expect(redirectUrl.searchParams.get("state")).toBe("/kos/123");
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

      const request = new NextRequest("http://localhost:3000/api/auth/callback/google?code=valid-auth-code&state=/kos/123");
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/kos/123");

      // Verifikasi cookie user_token terpasang
      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toContain("user_token=");
      expect(cookieHeader).toContain("HttpOnly");

      // Verifikasi user tersimpan di database
      const createdUser = await prisma.user.findUnique({
        where: { email: "mahasiswa.baru@gmail.com" },
      });
      expect(createdUser).toBeDefined();
      expect(createdUser?.name).toBe("Mahasiswa Baru");
      expect(createdUser?.google_id).toBe("google-uid-999");
      expect(createdUser?.avatar).toBe("https://lh3.googleusercontent.com/photo.jpg");
      expect(createdUser?.password).toBeNull();
    });

    it("berhasil login dan menautkan google_id pada pengguna yang sudah terdaftar sebelumnya", async () => {
      // Buat user manual terlebih dahulu
      const existingUser = await prisma.user.create({
        data: {
          name: "User Lama",
          email: "user.lama@gmail.com",
          password: "hashedpassword123",
          whatsapp: "081234567890",
        },
      });

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

      const request = new NextRequest("http://localhost:3000/api/auth/callback/google?code=valid-code-2");
      const response = await googleCallbackGET(request);

      expect(response.status).toBe(307);

      // Verifikasi user diperbarui dengan google_id
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
      });
      expect(updatedUser?.google_id).toBe("google-uid-888");
      expect(updatedUser?.avatar).toBe("https://lh3.googleusercontent.com/photo-lama.jpg");
      expect(updatedUser?.whatsapp).toBe("081234567890"); // data WA lama tidak hilang
    });
  });
});
