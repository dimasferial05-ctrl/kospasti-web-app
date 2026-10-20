import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/user/bookings/[id]/cancel/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("User Booking Cancellation Race Condition & Room Inventory Protection (Issue #267)", () => {
  const mockUserId = "user-123";
  const mockBookingId = "booking-abc";
  const mockPropertyId = "property-xyz";
  const mockRoomTypeId = "room-type-456";

  beforeEach(() => {
    vi.restoreAllMocks();

    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "valid-user-token" }),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: mockUserId,
      email: "user@example.com",
      name: "Budi Santoso",
      whatsapp: "081234567890",
    } as unknown as never);
  });

  const createRequest = (body: Record<string, unknown> = {}) => {
    return new Request(`http://localhost:3000/api/user/bookings/${mockBookingId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Alur PENDING -> CANCELLED", () => {
    it("Berhasil membatalkan pesanan PENDING dan menambah kuota kamar (+1)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PENDING",
        property_id: mockPropertyId,
        room_type_id: mockRoomTypeId,
      } as unknown as never);

      const mockTx = {
        booking: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue({
            id: mockBookingId,
            status: "CANCELLED",
            cancellation_reason: "Berubah pikiran",
          }),
        },
        property: {
          update: vi.fn().mockResolvedValue({ id: mockPropertyId }),
        },
        roomType: {
          update: vi.fn().mockResolvedValue({ id: mockRoomTypeId }),
        },
        magicLink: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        if (typeof callback === "function") {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        }
        return undefined;
      });

      const req = createRequest({ reason: "Berubah pikiran" });
      const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Pesanan berhasil dibatalkan.");
      expect(data.data.status).toBe("CANCELLED");

      // Verifikasi updateMany bersyarat dipanggil dengan status PENDING
      expect(mockTx.booking.updateMany).toHaveBeenCalledWith({
        where: { id: mockBookingId, status: "PENDING" },
        data: {
          status: "CANCELLED",
          cancellation_reason: "Berubah pikiran",
        },
      });

      // Verifikasi stok kamar bertambah +1
      expect(mockTx.property.update).toHaveBeenCalledTimes(1);
      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: mockPropertyId },
        data: { available_rooms: { increment: 1 } },
      });
      expect(mockTx.roomType.update).toHaveBeenCalledTimes(1);
      expect(mockTx.roomType.update).toHaveBeenCalledWith({
        where: { id: mockRoomTypeId },
        data: { available_rooms: { increment: 1 } },
      });
    });

    it("Mencegah race condition / double-click: Request kedua (count === 0) di-rollback dan tidak menambah kamar ganda", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PENDING",
        property_id: mockPropertyId,
        room_type_id: mockRoomTypeId,
      } as unknown as never);

      let executionCount = 0;
      const propertyUpdateSpy = vi.fn().mockResolvedValue({ id: mockPropertyId });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        executionCount++;
        const isFirstCall = executionCount === 1;

        const mockTx = {
          booking: {
            updateMany: vi.fn().mockResolvedValue({ count: isFirstCall ? 1 : 0 }),
            findUnique: vi.fn().mockResolvedValue({
              id: mockBookingId,
              status: "CANCELLED",
            }),
          },
          property: {
            update: propertyUpdateSpy,
          },
          roomType: {
            update: vi.fn().mockResolvedValue({ id: mockRoomTypeId }),
          },
          magicLink: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };

        if (typeof callback === "function") {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        }
        return undefined;
      });

      // Request 1: Berhasil membatalkan pesanan (count === 1)
      const req1 = createRequest({ reason: "Batal 1" });
      const res1 = await POST(req1, { params: Promise.resolve({ id: mockBookingId }) });
      expect(res1.status).toBe(200);

      // Request 2: Datang hampir bersamaan, updateMany menghasilkan count === 0 karena status sudah bukan PENDING
      const req2 = createRequest({ reason: "Batal 2" });
      const res2 = await POST(req2, { params: Promise.resolve({ id: mockBookingId }) });
      const data2 = await res2.json();

      expect(res2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.error).toContain("sudah dibatalkan");

      // PENTING: Property update hanya dipanggil 1 kali, BUKAN 2 kali (mencegah penambahan kamar fiktif)
      expect(propertyUpdateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Alur PAID / APPROVED / ACCEPTED -> REFUND_REQUESTED", () => {
    it("Validasi: Menolak jika data rekening pengembalian dana tidak lengkap (400)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PAID",
        property_id: mockPropertyId,
        room_type_id: mockRoomTypeId,
      } as unknown as never);

      const req = createRequest({
        reason: "Ada keperluan mendadak",
        bankName: "BCA",
        // accountNumber dan accountHolder kosong
      });

      const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Mohon lengkapi seluruh formulir pengembalian dana");
    });

    it("Berhasil mengajukan refund pesanan PAID dan menambah kuota kamar (+1)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "PAID",
        property_id: mockPropertyId,
        room_type_id: mockRoomTypeId,
      } as unknown as never);

      const mockTx = {
        booking: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue({
            id: mockBookingId,
            status: "REFUND_REQUESTED",
          }),
        },
        property: {
          update: vi.fn().mockResolvedValue({ id: mockPropertyId }),
        },
        roomType: {
          update: vi.fn().mockResolvedValue({ id: mockRoomTypeId }),
        },
        magicLink: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        if (typeof callback === "function") {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        }
        return undefined;
      });

      const req = createRequest({
        reason: "Salah pilih kos",
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "Budi Santoso",
      });

      const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Pengajuan pembatalan dan pengembalian dana berhasil diajukan.");

      expect(mockTx.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockBookingId,
          status: { in: ["PAID", "APPROVED", "ACCEPTED"] },
        },
        data: {
          status: "REFUND_REQUESTED",
          cancellation_reason: "Salah pilih kos",
          refund_bank_name: "BCA",
          refund_account_number: "1234567890",
          refund_account_holder: "Budi Santoso",
        },
      });

      expect(mockTx.property.update).toHaveBeenCalledTimes(1);
      expect(mockTx.property.update).toHaveBeenCalledWith({
        where: { id: mockPropertyId },
        data: { available_rooms: { increment: 1 } },
      });
    });

    it("Mencegah race condition pada pengajuan refund: Request kedua (count === 0) ditolak 400 tanpa penambahan kuota kedua", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "APPROVED",
        property_id: mockPropertyId,
        room_type_id: mockRoomTypeId,
      } as unknown as never);

      let executionCount = 0;
      const propertyUpdateSpy = vi.fn().mockResolvedValue({ id: mockPropertyId });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        executionCount++;
        const isFirstCall = executionCount === 1;

        const mockTx = {
          booking: {
            updateMany: vi.fn().mockResolvedValue({ count: isFirstCall ? 1 : 0 }),
            findUnique: vi.fn().mockResolvedValue({
              id: mockBookingId,
              status: "REFUND_REQUESTED",
            }),
          },
          property: {
            update: propertyUpdateSpy,
          },
          roomType: {
            update: vi.fn().mockResolvedValue({ id: mockRoomTypeId }),
          },
          magicLink: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };

        if (typeof callback === "function") {
          return (callback as (tx: unknown) => Promise<unknown>)(mockTx);
        }
        return undefined;
      });

      const refundBody = {
        reason: "Double submit",
        bankName: "Mandiri",
        accountNumber: "987654321",
        accountHolder: "Budi Santoso",
      };

      const res1 = await POST(createRequest(refundBody), { params: Promise.resolve({ id: mockBookingId }) });
      expect(res1.status).toBe(200);

      const res2 = await POST(createRequest(refundBody), { params: Promise.resolve({ id: mockBookingId }) });
      const data2 = await res2.json();

      expect(res2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.error).toContain("Pengajuan pembatalan sudah diproses");

      // Kuota kamar hanya bertambah 1 kali
      expect(propertyUpdateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validasi Otorisasi & Status Booking", () => {
    it("Menolak 401 jika user belum login (tidak ada cookie user_token)", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        get: vi.fn().mockReturnValue(undefined),
      });

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      expect(res.status).toBe(401);
    });

    it("Menolak 403 jika booking bukan milik user yang sedang login", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: "other-user-999",
        status: "PENDING",
      } as unknown as never);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      expect(res.status).toBe(403);
    });

    it("Menolak 400 jika pesanan memang sudah berstatus CANCELLED atau REFUNDED", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        id: mockBookingId,
        user_id: mockUserId,
        status: "CANCELLED",
      } as unknown as never);

      const res = await POST(createRequest(), { params: Promise.resolve({ id: mockBookingId }) });
      expect(res.status).toBe(400);
    });
  });
});
