import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as setPasswordPOST } from "../src/app/api/user/set-password/route";
import { prisma } from "../src/lib/prisma";
import { signUserToken } from "../src/lib/auth";
import bcrypt from "bcryptjs";

// Mock next/headers cookies
const mockCookiesStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = mockCookiesStore.get(key);
      return val ? { name: key, value: val } : undefined;
    },
    set: (obj: { name: string; value: string }) => {
      mockCookiesStore.set(obj.name, obj.value);
    },
  })),
}));

describe("POST /api/user/set-password (Account Linking & Password Retrofitting)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  it("mengembalikan status 401 jika pengguna belum login", async () => {
    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newPassword: "password123",
        confirmPassword: "password123",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("mengembalikan status 400 jika password baru kurang dari 8 karakter", async () => {
    const token = await signUserToken({
      userId: "user-google-1",
      email: "googleuser@example.com",
      name: "Google User",
    });
    mockCookiesStore.set("user_token", token);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-google-1",
      email: "googleuser@example.com",
      password: null,
      google_id: "google-12345",
    } as any);

    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newPassword: "short",
        confirmPassword: "short",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("8 karakter");
  });

  it("mengembalikan status 400 jika konfirmasi password tidak cocok", async () => {
    const token = await signUserToken({
      userId: "user-google-1",
      email: "googleuser@example.com",
      name: "Google User",
    });
    mockCookiesStore.set("user_token", token);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-google-1",
      email: "googleuser@example.com",
      password: null,
      google_id: "google-12345",
    } as any);

    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newPassword: "password123",
        confirmPassword: "passwordBerbeda",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak cocok");
  });

  it("berhasil membuat password untuk pengguna Google OAuth (password sebelumnya null)", async () => {
    const token = await signUserToken({
      userId: "user-google-1",
      email: "googleuser@example.com",
      name: "Google User",
    });
    mockCookiesStore.set("user_token", token);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-google-1",
      email: "googleuser@example.com",
      password: null,
      google_id: "google-12345",
    } as any);

    const updateSpy = vi.spyOn(prisma.user, "update").mockResolvedValue({
      id: "user-google-1",
      email: "googleuser@example.com",
      password: "hashed_password",
    } as any);

    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newPassword: "passwordBaru123",
        confirmPassword: "passwordBaru123",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.hasPassword).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-google-1" },
        data: expect.objectContaining({
          password: expect.any(String),
        }),
      })
    );
  });

  it("mengembalikan status 400 jika pengguna sudah punya password tapi currentPassword salah", async () => {
    const token = await signUserToken({
      userId: "user-regular-1",
      email: "regular@example.com",
      name: "Regular User",
    });
    mockCookiesStore.set("user_token", token);

    const oldHashed = await bcrypt.hash("passwordLama123", 10);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-regular-1",
      email: "regular@example.com",
      password: oldHashed,
      google_id: null,
    } as any);

    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "passwordSalah",
        newPassword: "passwordBaru123",
        confirmPassword: "passwordBaru123",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Password saat ini tidak sesuai");
  });

  it("berhasil memperbarui password jika pengguna memasukkan currentPassword yang benar", async () => {
    const token = await signUserToken({
      userId: "user-regular-1",
      email: "regular@example.com",
      name: "Regular User",
    });
    mockCookiesStore.set("user_token", token);

    const oldHashed = await bcrypt.hash("passwordLama123", 10);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: "user-regular-1",
      email: "regular@example.com",
      password: oldHashed,
      google_id: null,
    } as any);

    const updateSpy = vi.spyOn(prisma.user, "update").mockResolvedValue({
      id: "user-regular-1",
      email: "regular@example.com",
      password: "new_hashed_password",
    } as any);

    const request = new Request("http://localhost:3000/api/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "passwordLama123",
        newPassword: "passwordBaru123",
        confirmPassword: "passwordBaru123",
      }),
    });

    const response = await setPasswordPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("berhasil diperbarui");
    expect(updateSpy).toHaveBeenCalled();
  });
});
