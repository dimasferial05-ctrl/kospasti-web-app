import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { GET as getProfileGET, PUT as updateProfilePUT } from "../src/app/api/partner/profile/route";
import { PUT as updatePasswordPUT } from "../src/app/api/partner/password/route";

describe("Partner Profile & Account Security Management (Issue #255)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Skema Database Prisma (Model Owner)", () => {
    it("memiliki atribut avatar_url pada model Owner di prisma/schema.prisma", () => {
      const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
      expect(fs.existsSync(schemaPath)).toBe(true);

      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("model Owner");
      expect(content).toContain("avatar_url");
    });
  });

  describe("2. Validasi Input Profil Mitra", () => {
    it("memvalidasi panjang nama minimal 2 karakter dan maksimal 100 karakter", () => {
      const validateName = (name: string) => {
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 100;
      };

      expect(validateName("")).toBe(false);
      expect(validateName("A")).toBe(false);
      expect(validateName("  A  ")).toBe(false);
      expect(validateName("Haji Sulaiman")).toBe(true);
      expect(validateName("Pengelola Kos Ibu Dewi")).toBe(true);
      expect(validateName("A".repeat(101))).toBe(false);
    });

    it("memvalidasi format nomor WhatsApp Indonesia valid (08 / 628 / +628)", () => {
      const waRegex = /^(?:\+62|62|0)8[0-9]{8,12}$/;

      expect(waRegex.test("08123456789")).toBe(true);
      expect(waRegex.test("081234567890")).toBe(true);
      expect(waRegex.test("+6281234567890")).toBe(true);
      expect(waRegex.test("6281234567890")).toBe(true);

      // Format tidak valid
      expect(waRegex.test("123456789")).toBe(false);
      expect(waRegex.test("07123456789")).toBe(false);
      expect(waRegex.test("08123")).toBe(false); // Terlalu pendek
      expect(waRegex.test("08123456789012345")).toBe(false); // Terlalu panjang
      expect(waRegex.test("08123abc789")).toBe(false); // Ada huruf
    });

    it("memvalidasi batas ukuran file avatar maksimal 2MB dan format gambar valid", () => {
      const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB

      const validateFile = (filename: string, sizeBytes: number) => {
        const ext = path.extname(filename).toLowerCase();
        return ALLOWED_EXTS.has(ext) && sizeBytes <= MAX_SIZE;
      };

      expect(validateFile("profile.jpg", 1024 * 500)).toBe(true);
      expect(validateFile("logo.png", 1024 * 1024)).toBe(true);
      expect(validateFile("avatar.webp", 2 * 1024 * 1024)).toBe(true);

      // Tidak valid
      expect(validateFile("document.pdf", 1024 * 500)).toBe(false);
      expect(validateFile("script.js", 100)).toBe(false);
      expect(validateFile("huge_photo.png", 3 * 1024 * 1024)).toBe(false); // 3MB
    });
  });

  describe("3. Validasi & Keamanan Kata Sandi Mitra", () => {
    it("memvalidasi kata sandi baru minimal 6 karakter dan cocok dengan konfirmasi", () => {
      const validatePasswordChange = (newPass: string, confirmPass: string) => {
        return typeof newPass === "string" && newPass.length >= 6 && newPass === confirmPass;
      };

      expect(validatePasswordChange("12345", "12345")).toBe(false); // Kurang dari 6
      expect(validatePasswordChange("secret123", "secret321")).toBe(false); // Tidak cocok
      expect(validatePasswordChange("kospasti2026", "kospasti2026")).toBe(true);
    });

    it("menghash kata sandi dengan bcrypt secara aman", async () => {
      const plainPassword = "mitraPasswordSecure123";
      const hash = await bcrypt.hash(plainPassword, 10);

      expect(hash).not.toBe(plainPassword);
      expect(await bcrypt.compare(plainPassword, hash)).toBe(true);
      expect(await bcrypt.compare("wrongPassword", hash)).toBe(false);
    });
  });

  describe("4. Proteksi Autentikasi API Routes (/api/partner/profile & /password)", () => {
    it("mengembalikan 401 Unauthorized jika GET /api/partner/profile diakses tanpa cookie partner_token", async () => {
      const req = new NextRequest("http://localhost:3000/api/partner/profile");
      const res = await getProfileGET(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unauthorized");
    });

    it("mengembalikan 401 Unauthorized jika PUT /api/partner/profile diakses tanpa cookie partner_token", async () => {
      const req = new NextRequest("http://localhost:3000/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Haji Sulaiman" }),
      });

      const res = await updateProfilePUT(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unauthorized");
    });

    it("mengembalikan 401 Unauthorized jika PUT /api/partner/password diakses tanpa cookie partner_token", async () => {
      const req = new NextRequest("http://localhost:3000/api/partner/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: "old",
          new_password: "newpassword123",
          confirm_password: "newpassword123",
        }),
      });

      const res = await updatePasswordPUT(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unauthorized");
    });
  });
});
