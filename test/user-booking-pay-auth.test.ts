import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/bookings/[id]/pay/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";
import * as whatsappLib from "@/lib/whatsapp";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

describe("User Booking Payment Authentication & Authorization (Issue #271)", () => {
  const mockUserId = "user-alice-123";
  const mockBookingId = "booking-uuid-789";

  beforeEach(() => {
    vi.restoreAllMocks();

    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-user-token" }),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: mockUserId,
      email: "alice@example.com",
      name: "Alice",
      whatsapp: "081234567890",
    } as unknown as never);
  });

  const createRequest = () => {
    return new Request(`http://localhost:3000/api/bookings/${mockBookingId}/pay`, {
      method: "POST",
    });
  };

  describe("Skenario Autentikasi Pengguna (401 Unauthorized)", () => {
    it("Menolak 401 jika cookie user_token tidak ada", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        get: vi.fn().mockReturnValue(undefined),
      });

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Anda harus login terlebih dahulu");
    });

    it("Menolak 401 jika token sesi tidak valid atau telah kedaluwarsa", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce(null as unknown as never);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Sesi pengguna tidak valid atau telah kedaluwarsa");
    });
  });

  describe("Skenario Validasi Parameter & Eksistensi Booking", () => {
    it("Menolak 400 jika ID booking kosong", async () => {
      const res = await POST(createRequest(), { params: Promise.resolve({ id: "   " }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("ID booking diperlukan");
    });

    it("Menolak 404 jika booking tidak ditemukan di database", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(null);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Booking tidak ditemukan");
    });
  });

  describe("Skenario Otorisasi Kepemilikan Booking (403 Forbidden)", () => {
    it("Menolak 403 jika booking dimiliki oleh pengguna lain", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: mockBookingId,
        user_id: "other-user-bob",
        status: "PENDING",
      } as unknown as never);

      const updateSpy = vi.spyOn(prisma.booking, "update");

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Akses ditolak: Anda tidak memiliki izin untuk memproses pembayaran pesanan ini");
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Skenario Status Booking Tidak Valid (400 Bad Request)", () => {
    it("Menolak 400 jika booking sudah berstatus PAID", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PAID",
      } as unknown as never);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Pembayaran sudah dilakukan sebelumnya");
    });

    it("Menolak 400 jika booking berstatus selain PENDING (misal CANCELLED)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: mockBookingId,
        user_id: mockUserId,
        status: "CANCELLED",
      } as unknown as never);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Status booking tidak valid untuk pembayaran");
    });
  });

  describe("Skenario Sukses Pembayaran oleh Pemilik Sah (200 OK)", () => {
    it("Berhasil memproses pembayaran jika pemanggil adalah pemilik sah booking", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PENDING",
        student_name: "Alice",
        move_in_date: new Date("2026-11-01"),
        property: {
          name: "Kos Mawar Indah",
          owner: {
            id: "owner-1",
            name: "Pak Kosim",
            whatsapp_number: "081987654321",
          },
        },
      } as unknown as never);

      vi.spyOn(prisma.booking, "update").mockResolvedValueOnce({
        id: mockBookingId,
        status: "PAID",
      } as unknown as never);

      vi.spyOn(prisma.magicLink, "updateMany").mockResolvedValueOnce({ count: 1 });
      vi.spyOn(prisma.magicLink, "create").mockResolvedValueOnce({ id: "ml-new" } as unknown as never);
      const sendWhatsAppSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Pembayaran berhasil dikonfirmasi");
      expect(data.data.status).toBe("PAID");
      expect(sendWhatsAppSpy).toHaveBeenCalledTimes(1);
      expect(sendWhatsAppSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081987654321",
          message: expect.stringContaining("Alice"),
        })
      );
    });
  });
});
