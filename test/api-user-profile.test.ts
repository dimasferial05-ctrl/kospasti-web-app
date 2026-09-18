import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as profileGET, PATCH as profilePATCH } from "../src/app/api/user/profile/route";
import { GET as bookingsGET } from "../src/app/api/user/bookings/route";
import { prisma } from "../src/lib/prisma";
import { signUserToken } from "../src/lib/auth";

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

describe("User Profile & Bookings API Endpoints (/api/user/profile & /api/user/bookings)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  describe("GET /api/user/profile", () => {
    it("mengembalikan status 401 jika tidak ada cookie user_token", async () => {
      const response = await profileGET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("mengembalikan status 200 dengan data user lengkap saat token valid", async () => {
      const token = await signUserToken({
        userId: "user-test-1",
        email: "test@example.com",
        name: "Test User",
        whatsapp: "08123456789",
      });
      mockCookiesStore.set("user_token", token);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-test-1",
        name: "Test User",
        email: "test@example.com",
        whatsapp: "08123456789",
        bio: "Halo saya pencari kos",
        avatar: "/uploads/avatars/user.jpg",
        created_at: new Date("2026-01-01"),
      } as any);

      const response = await profileGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe("Test User");
      expect(data.user.bio).toBe("Halo saya pencari kos");
      expect(data.user.avatar).toBe("/uploads/avatars/user.jpg");
    });
  });

  describe("PATCH /api/user/profile", () => {
    it("mengembalikan status 401 jika tidak terautentikasi", async () => {
      const request = new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ whatsapp: "08123456789" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await profilePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("mengembalikan status 400 jika nomor whatsapp tidak valid", async () => {
      const token = await signUserToken({
        userId: "user-test-1",
        email: "test@example.com",
        name: "Test User",
      });
      mockCookiesStore.set("user_token", token);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-test-1",
        avatar: null,
      } as any);

      const request = new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ whatsapp: "invalid-number" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await profilePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("nomor WhatsApp tidak valid");
    });

    it("mengembalikan status 400 jika bio melebihi 150 karakter", async () => {
      const token = await signUserToken({
        userId: "user-test-1",
        email: "test@example.com",
        name: "Test User",
      });
      mockCookiesStore.set("user_token", token);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-test-1",
        avatar: null,
      } as any);

      const longBio = "a".repeat(151);
      const request = new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ whatsapp: "081234567890", bio: longBio }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await profilePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("150 karakter");
    });

    it("berhasil memperbarui data profil nama, whatsapp, dan bio", async () => {
      const token = await signUserToken({
        userId: "user-test-1",
        email: "test@example.com",
        name: "Old Name",
      });
      mockCookiesStore.set("user_token", token);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-test-1",
        avatar: null,
      } as any);

      vi.spyOn(prisma.user, "update").mockResolvedValue({
        id: "user-test-1",
        name: "New Name",
        email: "test@example.com",
        whatsapp: "081234567890",
        bio: "Bio baru saya",
        avatar: null,
      } as any);

      const request = new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: "New Name",
          whatsapp: "081234567890",
          bio: "Bio baru saya",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await profilePATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe("New Name");
      expect(data.user.whatsapp).toBe("081234567890");
      expect(data.user.bio).toBe("Bio baru saya");
    });
  });

  describe("GET /api/user/bookings", () => {
    it("mengembalikan status 401 jika tidak ada token autentikasi", async () => {
      const response = await bookingsGET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("mengembalikan daftar pesanan milik pengguna yang sesuai", async () => {
      const token = await signUserToken({
        userId: "user-test-1",
        email: "test@example.com",
        name: "Test User",
      });
      mockCookiesStore.set("user_token", token);

      const mockBookings = [
        {
          id: "booking-1",
          student_name: "Test User",
          student_whatsapp: "081234567890",
          move_in_date: new Date("2026-10-01"),
          status: "PENDING",
          created_at: new Date("2026-09-18"),
          property: {
            id: "prop-1",
            name: "Kos Melati",
            price_per_month: 850000,
            available_rooms: 2,
            gender_type: "PUTRI",
            facilities: "WiFi, Kasur",
            image_url: "https://example.com/kos.jpg",
            address: "Jl. Mawar No. 1",
          },
        },
      ];

      vi.spyOn(prisma.booking, "findMany").mockResolvedValue(mockBookings as any);

      const response = await bookingsGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bookings.length).toBe(1);
      expect(data.bookings[0].id).toBe("booking-1");
      expect(data.bookings[0].property.name).toBe("Kos Melati");
    });
  });
});
