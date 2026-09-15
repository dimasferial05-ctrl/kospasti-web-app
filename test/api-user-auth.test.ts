import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as registerPOST } from "../src/app/api/register/route";
import { POST as loginPOST, userLoginAttempts } from "../src/app/api/login/route";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

describe("User Authentication API Endpoints (/api/register & /api/login)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    userLoginAttempts.clear();
  });

  describe("POST /api/register", () => {
    it("mengembalikan status 400 jika body request kosong atau tidak valid", async () => {
      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: "invalid-json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Format request tidak valid.");
    });

    it("mengembalikan status 400 jika name, email, atau password kosong", async () => {
      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "", email: "user@test.com", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Nama lengkap, email, dan password wajib diisi.");
    });

    it("mengembalikan status 400 jika format email tidak valid", async () => {
      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "Budi", email: "invalid-email", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Format alamat email tidak valid.");
    });

    it("mengembalikan status 400 jika password kurang dari 8 karakter", async () => {
      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "Budi", email: "budi@test.com", password: "short" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Password minimal terdiri dari 8 karakter.");
    });

    it("mengembalikan status 400 jika email sudah terdaftar", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "existing-uuid",
        name: "Existing User",
        email: "existing@test.com",
        password: "hashedpassword",
        whatsapp: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify({ name: "Budi", email: "existing@test.com", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email sudah terdaftar.");
    });

    it("berhasil mendaftarkan pengguna baru dan mengembalikan status 201 dengan password yang di-hash", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
      const mockCreatedUser = {
        id: "new-user-123",
        name: "Ahmad Dahlan",
        email: "ahmad@test.com",
        whatsapp: "08123456789",
        created_at: new Date(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createSpy = vi.spyOn(prisma.user, "create").mockResolvedValue(mockCreatedUser as any);

      const request = new Request("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Ahmad Dahlan",
          email: "ahmad@test.com",
          password: "password123",
          whatsapp: "08123456789",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Pendaftaran akun berhasil.");
      expect(data.user.id).toBe("new-user-123");
      expect(data.user.email).toBe("ahmad@test.com");
      expect(data.user.password).toBeUndefined();

      // Pastikan password di-hash sebelum dikirim ke database
      expect(createSpy).toHaveBeenCalled();
      const callData = createSpy.mock.calls[0][0].data;
      expect(callData.password).not.toBe("password123");
      expect(await bcrypt.compare("password123", callData.password)).toBe(true);
    });
  });

  describe("POST /api/login", () => {
    it("mengembalikan status 401 jika email atau password tidak dikirimkan", async () => {
      const request = new Request("http://localhost:3000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email atau password salah.");
    });

    it("mengembalikan status 401 jika pengguna dengan email tersebut tidak ditemukan", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "unknown@test.com", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email atau password salah.");
    });

    it("mengembalikan status 401 jika password salah", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 10);
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "test@test.com",
        password: hashedPassword,
        whatsapp: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new Request("http://localhost:3000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "wrong-password" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email atau password salah.");
    });

    it("berhasil login dan memasang cookie user_token saat kredensial valid", async () => {
      const hashedPassword = await bcrypt.hash("valid-password", 10);
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Budi Santoso",
        email: "budi@test.com",
        password: hashedPassword,
        whatsapp: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new Request("http://localhost:3000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "budi@test.com", password: "valid-password" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Login berhasil.");
      expect(data.user.id).toBe("user-123");
      expect(data.user.name).toBe("Budi Santoso");

      const cookiesHeader = response.headers.get("set-cookie");
      expect(cookiesHeader).toBeDefined();
      expect(cookiesHeader).toContain("user_token=");
      expect(cookiesHeader?.toLowerCase()).toContain("httponly");
    });

    it("mengembalikan status 429 jika melebihi batas percobaan gagal (rate limit)", async () => {
      const ip = "10.0.0.1";
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        const req = new Request("http://localhost:3000/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "fail@test.com", password: "wrong" }),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
          },
        });
        const res = await loginPOST(req);
        expect(res.status).toBe(401);
      }

      // Percobaan ke-6 harus ditolak oleh rate limiter (429)
      const blockedReq = new Request("http://localhost:3000/api/login", {
        method: "POST",
        body: JSON.stringify({ email: "fail@test.com", password: "wrong" }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
      });

      const blockedRes = await loginPOST(blockedReq);
      const data = await blockedRes.json();

      expect(blockedRes.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Terlalu banyak percobaan");
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
    });
  });
});
