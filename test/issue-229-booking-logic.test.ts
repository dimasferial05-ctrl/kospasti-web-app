import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/bookings/route";
import { prisma } from "../src/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "../src/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Issue #229: Booking Logic & Profile Upgrades (Non-Destructive Mocked Tests)", () => {
  const mockUserId = "user-uuid-123";
  const mockPropertyId = "property-uuid-456";

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock autentikasi cookie & verifyUserToken
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-session-token" }),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: mockUserId,
      email: "mahasiswa@example.com",
      name: "Dimas Ferial",
      whatsapp: "081234567890",
    } as any);

    // Mock findUnique user agar tidak menyentuh database asli
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: mockUserId,
      name: "Dimas Ferial",
      whatsapp: "081234567890",
    } as any);
  });

  describe("POST /api/bookings - Validasi Anti-Spam & Double Booking", () => {
    it("menolak booking (400) jika user masih memiliki pesanan berstatus PENDING", async () => {
      // Mock findFirst menemukan booking PENDING aktif milik user
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValueOnce({
        id: "existing-pending-booking-999",
        status: "PENDING",
        user_id: mockUserId,
        property_id: "other-prop-777",
        property: {
          id: "other-prop-777",
          name: "Kos Melati Putri",
        },
      } as any);

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: mockPropertyId,
          studentName: "Dimas Ferial",
          waNumber: "081234567890",
          moveInDate: "2026-11-01",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.hasPendingBooking).toBe(true);
      expect(result.pendingBookingId).toBe("existing-pending-booking-999");
      expect(result.error).toContain("Anda masih memiliki pesanan yang belum dibayar");
    });

    it("mengizinkan booking baru jika user TIDAK memiliki pesanan berstatus PENDING", async () => {
      // Mock findFirst tidak menemukan pesanan PENDING (null)
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValueOnce(null);

      // Mock $transaction untuk mensimulasikan booking berhasil dibuat tanpa mutasi DB
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          booking: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: "new-booking-created-111",
              status: "PENDING",
              user_id: mockUserId,
              property_id: mockPropertyId,
            }),
          },
          roomType: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          property: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(txMock);
      });

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: mockPropertyId,
          studentName: "Dimas Ferial",
          waNumber: "081234567890",
          moveInDate: "2026-11-01",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data.bookingId).toBe("new-booking-created-111");
    });

    it("menangani race condition dengan menolak transaksi jika PENDING ditemukan di dalam transaksi (ACTIVE_PENDING_EXISTS)", async () => {
      // Pre-check di luar lolos
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValueOnce(null);

      // Tetapi di dalam transaksi terdeteksi concurrent booking
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const txMock = {
          booking: {
            findFirst: vi.fn().mockResolvedValue({ id: "concurrent-booking-id" }),
          },
        };
        return callback(txMock);
      });

      const request = new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: mockPropertyId,
          studentName: "Dimas Ferial",
          waNumber: "081234567890",
          moveInDate: "2026-11-01",
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.hasPendingBooking).toBe(true);
      expect(result.error).toContain("Anda masih memiliki pesanan yang belum dibayar");
    });
  });

  describe("Profile Page UI - Tombol Bayar Sekarang di Riwayat Pesanan", () => {
    it("memastikan kode profil memiliki tautan Bayar Sekarang ke /checkout/[id] untuk pesanan PENDING", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const profilPath = path.resolve(__dirname, "../src/app/profil/page.tsx");
      const content = fs.readFileSync(profilPath, "utf-8");

      // Verifikasi logika render tombol Bayar Sekarang
      expect(content).toContain('booking.status?.toUpperCase() === "PENDING"');
      expect(content).toContain("Bayar Sekarang");
      expect(content).toContain("/checkout/${booking.id}");
      expect(content).toContain("bg-emerald-600");
    });
  });

  describe("Property Detail Page UI - Modal Peringatan Booking Pending", () => {
    it("memastikan kode detail kos menangani hasPendingBooking dan menampilkan modal pemberitahuan", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const kosPath = path.resolve(__dirname, "../src/app/kos/[id]/page.tsx");
      const content = fs.readFileSync(kosPath, "utf-8");

      // Verifikasi penanganan error response hasPendingBooking
      expect(content).toContain("responseData.hasPendingBooking");
      expect(content).toContain("pendingBookingNotice");
      expect(content).toContain("/profil?tab=bookings");
      expect(content).toContain("Pesanan Masih Menunggu Pembayaran");
    });
  });
});
