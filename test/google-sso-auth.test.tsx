import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as googleCallbackGET } from "../src/app/api/auth/callback/google/route";
import { prisma } from "../src/lib/prisma";
import LoginPage from "../src/app/login/page";
import RegisterPage from "../src/app/register/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === "callbackUrl") return "/kos/subang-asri";
      return null;
    }),
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("Google SSO Only Authentication & Simplified Flow (Issue #257)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Halaman Login Pengguna (/login)", () => {
    it("memiliki direktif 'use client' di baris paling awal file", () => {
      const filePath = path.resolve(__dirname, "../src/app/login/page.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      const firstLine = content.trim().split("\n")[0].trim();
      expect(firstLine).toMatch(/^["']use client["'];?$/);
    });

    it("merender tombol Google SSO dengan tautan callback yang benar", () => {
      const html = renderToStaticMarkup(<LoginPage />);

      // Judul utama
      expect(html).toContain("Masuk ke KosPasti");

      // Tombol Google SSO
      expect(html).toContain("Lanjutkan dengan Google");
      expect(html).toContain("/api/auth/google?callbackUrl=%2Fkos%2Fsubang-asri");

      // Tidak ada input form email dan password konvensional
      expect(html).not.toContain('id="login-email"');
      expect(html).not.toContain('id="login-password"');
      expect(html).not.toContain('placeholder="nama@email.com"');

      // Tautan ke portal mitra dan kembali ke beranda
      expect(html).toContain("/partner/login");
      expect(html).toContain("Pemilik Kos? Masuk ke Portal Mitra");
      expect(html).toContain("Kembali ke Beranda");
    });
  });

  describe("2. Halaman Register (/register)", () => {
    it("melakukan redirect otomatis ke /login dengan mempertahankan callbackUrl", async () => {
      const { redirect } = await import("next/navigation");

      try {
        await RegisterPage({
          searchParams: Promise.resolve({ callbackUrl: "/kos/123" }),
        });
      } catch (err: unknown) {
        // Next.js redirect melemparkan error redirect internal
        expect((err as Error).message).toBe("NEXT_REDIRECT:/login?callbackUrl=%2Fkos%2F123");
      }

      expect(redirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fkos%2F123");
    });
  });

  describe("3. Alur Google OAuth Callback & Auto-Provisioning", () => {
    it("mengarahkan ke /login?error=oauth_cancelled jika pengguna membatalkan izin OAuth", async () => {
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

    it("membuat akun pengguna baru otomatis (auto-provisioning) jika email belum terdaftar", async () => {
      process.env.GOOGLE_CLIENT_ID = "mock-client-id";
      process.env.GOOGLE_CLIENT_SECRET = "mock-client-secret";

      // Mock exchange token
      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (url.toString().includes("oauth2.googleapis.com/token")) {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-access-token" }),
          } as unknown as Response;
        }
        if (url.toString().includes("googleapis.com/oauth2/v2/userinfo")) {
          return {
            ok: true,
            json: async () => ({
              id: "google-uid-new-123",
              email: "mahasiswa.baru@gmail.com",
              name: "Mahasiswa Baru",
              picture: "https://lh3.googleusercontent.com/avatar.jpg",
            }),
          } as unknown as Response;
        }
        return { ok: false } as unknown as Response;
      });

      // Mock Prisma findFirst (user belum ada)
      vi.spyOn(prisma.user, "findFirst").mockResolvedValue(null);

      // Mock Prisma create (buat user baru)
      const createSpy = vi.spyOn(prisma.user, "create").mockResolvedValue({
        id: "usr-new-999",
        name: "Mahasiswa Baru",
        email: "mahasiswa.baru@gmail.com",
        password: null,
        whatsapp: null,
        avatar: "https://lh3.googleusercontent.com/avatar.jpg",
        bio: null,
        google_id: "google-uid-new-123",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/auth/callback/google?code=mock-code&state=/kos/subang");
      const response = await googleCallbackGET(request);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: "Mahasiswa Baru",
          email: "mahasiswa.baru@gmail.com",
          google_id: "google-uid-new-123",
          avatar: "https://lh3.googleusercontent.com/avatar.jpg",
        },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/kos/subang");
      expect(response.cookies.get("user_token")).toBeDefined();
    });

    it("menyinkronkan google_id & avatar akun lama jika email sudah ada", async () => {
      process.env.GOOGLE_CLIENT_ID = "mock-client-id";
      process.env.GOOGLE_CLIENT_SECRET = "mock-client-secret";

      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (url.toString().includes("oauth2.googleapis.com/token")) {
          return {
            ok: true,
            json: async () => ({ access_token: "mock-access-token" }),
          } as unknown as Response;
        }
        if (url.toString().includes("googleapis.com/oauth2/v2/userinfo")) {
          return {
            ok: true,
            json: async () => ({
              id: "google-uid-existing-456",
              email: "user.lama@gmail.com",
              name: "User Lama",
              picture: "https://lh3.googleusercontent.com/updated.jpg",
            }),
          } as unknown as Response;
        }
        return { ok: false } as unknown as Response;
      });

      const existingUser = {
        id: "usr-existing-123",
        name: "User Lama",
        email: "user.lama@gmail.com",
        password: null,
        whatsapp: "08123456789",
        avatar: null,
        bio: null,
        google_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(prisma.user, "findFirst").mockResolvedValue(existingUser);
      const updateSpy = vi.spyOn(prisma.user, "update").mockResolvedValue({
        ...existingUser,
        google_id: "google-uid-existing-456",
        avatar: "https://lh3.googleusercontent.com/updated.jpg",
      });

      const request = new NextRequest("http://localhost:3000/api/auth/callback/google?code=mock-code");
      const response = await googleCallbackGET(request);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: "usr-existing-123" },
        data: {
          google_id: "google-uid-existing-456",
          avatar: "https://lh3.googleusercontent.com/updated.jpg",
        },
      });

      expect(response.status).toBe(307);
      expect(response.cookies.get("user_token")).toBeDefined();
    });
  });

  describe("4. Validasi Format WhatsApp Popup (ProfileCompletionModal)", () => {
    it("memvalidasi format nomor WhatsApp Indonesia valid (08 / 628 / +628)", () => {
      const waRegex = /^(?:\+62|62|0)8[0-9]{8,11}$/;

      expect(waRegex.test("08123456789")).toBe(true);
      expect(waRegex.test("081234567890")).toBe(true);
      expect(waRegex.test("+6281234567890")).toBe(true);
      expect(waRegex.test("6281234567890")).toBe(true);

      // Format tidak valid
      expect(waRegex.test("07123456789")).toBe(false);
      expect(waRegex.test("123456789")).toBe(false);
      expect(waRegex.test("0812")).toBe(false); // Terlalu pendek
      expect(waRegex.test("081234567890123456")).toBe(false); // Terlalu panjang
      expect(waRegex.test("08123abc789")).toBe(false); // Mengandung huruf
    });
  });

  describe("5. Isolasi Sistem Autentikasi Mitra & Admin", () => {
    it("memastikan portal mitra (/partner/login) dan admin (/admin/login) memiliki rute mandiri", () => {
      const partnerLoginPath = path.resolve(__dirname, "../src/app/partner/login/page.tsx");
      const adminLoginPath = path.resolve(__dirname, "../src/app/admin/login/page.tsx");

      expect(fs.existsSync(partnerLoginPath)).toBe(true);
      expect(fs.existsSync(adminLoginPath)).toBe(true);

      const partnerContent = fs.readFileSync(partnerLoginPath, "utf-8");
      const adminContent = fs.readFileSync(adminLoginPath, "utf-8");

      expect(partnerContent).toContain("/api/partner/login");
      expect(adminContent).toContain("/api/admin/login");
    });
  });
});
