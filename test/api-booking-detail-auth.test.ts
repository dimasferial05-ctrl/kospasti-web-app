import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/bookings/[id]/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";
import * as adminAuthLib from "@/lib/admin-auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Proteksi Otorisasi Endpoint Informasi Pesanan / Anti-IDOR (Issue #408)", () => {
  const mockTenantId = "tenant-alice-123";
  const mockOtherTenantId = "tenant-bob-456";
  const mockOwnerId = "owner-alpha-789";
  const mockOtherOwnerId = "owner-beta-999";
  const mockBookingId = "booking-uuid-safe-101";

  const mockBookingData = {
    id: mockBookingId,
    student_name: "Alice Wonderland",
    student_whatsapp: "081234567890",
    move_in_date: new Date("2026-12-01"),
    status: "PENDING",
    amount: 1500000,
    service_fee: 5000,
    created_at: new Date("2026-11-18T10:00:00Z"),
    paid_at: null,
    payment_method: null,
    payment_gateway_ref: null,
    snap_token: "mock-snap-token-123",
    user_id: mockTenantId,
    property: {
      id: "prop-alpha",
      name: "Kos Graha Pasti",
      address: "Jl. Sukun No. 5",
      price_per_month: 1500000,
      image_url: "/uploads/image.jpg",
      gender_type: "CAMPUR",
      owner_id: mockOwnerId,
      owner: {
        name: "Pak Kos Alpha",
        whatsapp_number: "081999888777",
      },
    },
    room_type: null,
    user: {
      email: "alice@example.com",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock: unauthenticated
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
    vi.spyOn(adminAuthLib, "isValidAdminRequest").mockReturnValue(false);
  });

  const createGetRequest = () => {
    return new Request(`http://localhost:3000/api/bookings/${mockBookingId}`, {
      method: "GET",
    });
  };

  describe("1. Validasi Input Parameter (400 Bad Request)", () => {
    it("menolak request jika parameter ID booking kosong", async () => {
      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: "   " }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("ID booking diperlukan");
    });
  });

  describe("2. Skenario Autentikasi Pengguna (401 Unauthorized)", () => {
    it("menolak 401 jika tidak ada cookie autentikasi (user, partner, maupun admin)", async () => {
      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Anda harus login terlebih dahulu");
    });

    it("menolak 401 jika cookie user_token tidak valid atau kedaluwarsa", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "user_token" ? { value: "invalid-user-token" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce(null);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Anda harus login terlebih dahulu");
    });

    it("menolak 401 jika cookie partner_token tidak valid atau kedaluwarsa", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "partner_token" ? { value: "invalid-partner-token" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValueOnce(null);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Anda harus login terlebih dahulu");
    });
  });

  describe("3. Skenario Keberadaan Booking (404 Not Found)", () => {
    it("mengembalikan status 404 jika booking tidak ditemukan di database bagi pengguna yang login", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "user_token" ? { value: "valid-token" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce({
        userId: mockTenantId,
        email: "alice@example.com",
        name: "Alice",
      } as never);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(null);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Booking tidak ditemukan");
    });
  });

  describe("4. Skenario Proteksi Anti-IDOR (403 Forbidden)", () => {
    it("menolak 403 jika mahasiswa lain mencoba mengakses pesanan milik penyewa sah", async () => {
      // Mahasiswa Bob mencoba membuka pesanan milik Alice
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "user_token" ? { value: "token-bob" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce({
        userId: mockOtherTenantId,
        email: "bob@example.com",
        name: "Bob",
      } as never);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingData as never);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Akses ditolak: Anda tidak memiliki izin untuk melihat rincian pesanan ini");
    });

    it("menolak 403 jika mitra pemilik kos lain mencoba mengakses pesanan pada kos bukan miliknya", async () => {
      // Mitra Beta mencoba membuka pesanan kos milik Mitra Alpha
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "partner_token" ? { value: "token-partner-beta" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValueOnce({
        ownerId: mockOtherOwnerId,
        name: "Pak Kos Beta",
        whatsapp_number: "081222333444",
        role: "OWNER",
      } as never);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingData as never);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Akses ditolak: Anda tidak memiliki izin untuk melihat rincian pesanan ini");
    });
  });

  describe("5. Skenario Akses Sah (200 OK)", () => {
    it("mengizinkan mahasiswa pemilik pesanan melihat rincian pesanannya sendiri", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "user_token" ? { value: "token-alice" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce({
        userId: mockTenantId,
        email: "alice@example.com",
        name: "Alice",
      } as never);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingData as never);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockBookingId);
      expect(data.data.studentName).toBe("Alice Wonderland");
      expect(data.data.pricing.totalPrice).toBe(1505000);
    });

    it("mengizinkan mitra pemilik kos melihat rincian pesanan pada kos miliknya", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) =>
          name === "partner_token" ? { value: "token-alpha" } : undefined
        ),
      });
      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValueOnce({
        ownerId: mockOwnerId,
        name: "Pak Kos Alpha",
        whatsapp_number: "081999888777",
        role: "OWNER",
      } as never);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingData as never);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.property.name).toBe("Kos Graha Pasti");
    });

    it("mengizinkan administrator sistem melihat rincian pesanan mana pun", async () => {
      vi.spyOn(adminAuthLib, "isValidAdminRequest").mockReturnValueOnce(true);
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBookingData as never);

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockBookingId);
    });
  });

  describe("6. Skenario Error Server (500)", () => {
    it("mengembalikan status 500 jika terjadi kegagalan database tak terduga", async () => {
      vi.spyOn(adminAuthLib, "isValidAdminRequest").mockReturnValueOnce(true);
      vi.spyOn(prisma.booking, "findUnique").mockRejectedValueOnce(
        new Error("Unexpected DB crash")
      );

      const res = await GET(createGetRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Gagal mengambil data booking");
    });
  });
});
