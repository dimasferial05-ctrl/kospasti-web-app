import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../src/app/api/admin/users/route";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./helpers";
import { NextRequest } from "next/server";

describe("GET /api/admin/users", () => {
  const createAuthorizedRequest = () => {
    return new NextRequest("http://localhost:3000/api/admin/users", {
      headers: {
        cookie: "admin_token=kospasti_admin_authenticated",
      },
    });
  };

  beforeEach(async () => {
    await clearDatabase();
    vi.restoreAllMocks();
  });

  describe("Skenario Autentikasi / Keamanan", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak disertakan", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/users");
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Sukses", () => {
    it("berhasil mengambil seluruh data pengguna beserta avatar, bio, dan total booking", async () => {
      const user1 = await prisma.user.create({
        data: {
          name: "Rizky Ramadhan",
          email: "rizky@example.com",
          whatsapp: "081234567890",
          avatar: "/uploads/avatars/rizky.png",
          bio: "Mahasiswa Informatika angkatan 2024",
          created_at: new Date("2026-09-01T10:00:00Z"),
        },
      });

      const user2 = await prisma.user.create({
        data: {
          name: "Siti Aisyah",
          email: "siti@example.com",
          whatsapp: "089876543210",
          bio: "Pencari kos ramah dan rapi",
          created_at: new Date("2026-09-02T10:00:00Z"),
        },
      });

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Urutan desc berdasarkan created_at (user2 terbaru duluan)
      expect(result.data[0].id).toBe(user2.id);
      expect(result.data[0].name).toBe("Siti Aisyah");
      expect(result.data[0].email).toBe("siti@example.com");
      expect(result.data[0].bio).toBe("Pencari kos ramah dan rapi");
      expect(result.data[0].avatar).toBeNull();
      expect(result.data[0]._count.bookings).toBe(0);

      expect(result.data[1].id).toBe(user1.id);
      expect(result.data[1].name).toBe("Rizky Ramadhan");
      expect(result.data[1].avatar).toBe("/uploads/avatars/rizky.png");
      expect(result.data[1].bio).toBe("Mahasiswa Informatika angkatan 2024");
    });

    it("mengembalikan array kosong jika belum ada data pengguna", async () => {
      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Skenario Gagal / Error Database", () => {
    it("mengembalikan status 500 jika terjadi error query database", async () => {
      vi.spyOn(prisma.user, "findMany").mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const response = await GET(createAuthorizedRequest());
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection lost");
    });
  });
});
