import { describe, it, expect, vi, beforeEach } from "vitest";
import { fulfillPaidBooking } from "@/lib/payment-fulfillment";
import { runPaymentReminderProcess } from "@/lib/payment-reminder-processor";
import { prisma } from "@/lib/prisma";

// Mock external side-effects
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true, simulated: true }),
  formatWhatsAppNumber: vi.fn((num: string) => num.replace(/\D/g, "")),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

describe("Konsistensi Inventaris Kamar & Single Source of Truth (Issue #404)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.magicLink, "updateMany").mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.magicLink, "create").mockResolvedValue({ id: "link-1", token: "token-1" } as never);
  });

  describe("1. Pencegahan Double-Decrement pada fulfillPaidBooking()", () => {
    it("TIDAK mengurangi kuota kamar (Property & RoomType) jika status awal booking adalah PENDING", async () => {
      const mockBooking = {
        id: "booking-pending-123",
        status: "PENDING",
        amount: 1500000,
        property_id: "prop-alpha",
        room_type_id: "room-type-deluxe",
        property: {
          id: "prop-alpha",
          name: "Kos Pasti Alpha",
          available_rooms: 3,
          owner: {
            id: "owner-1",
            name: "Bapak Kos",
            whatsapp_number: "081234567890",
          },
        },
        room_type: {
          id: "room-type-deluxe",
          name: "Deluxe AC",
          available_rooms: 2,
        },
        user: {
          id: "user-1",
          name: "Budi Santoso",
          whatsapp: "081111111111",
        },
      };

      const updateBookingSpy = vi.fn().mockResolvedValue({
        ...mockBooking,
        status: "PAID",
      });
      const updatePropertySpy = vi.fn().mockResolvedValue({});
      const updateRoomTypeSpy = vi.fn().mockResolvedValue({});
      const upsertPayoutSpy = vi.fn().mockResolvedValue({});

      const mockTx = {
        booking: {
          update: updateBookingSpy,
        },
        property: {
          update: updatePropertySpy,
        },
        roomType: {
          update: updateRoomTypeSpy,
        },
        payout: {
          upsert: upsertPayoutSpy,
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockBooking as never);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const result = await fulfillPaidBooking({
        bookingId: "booking-pending-123",
        paymentMethod: "MIDTRANS",
        paymentGatewayRef: "TRX-MIDTRANS-999",
      });

      expect(result.success).toBe(true);
      // Status booking berubah jadi PAID
      expect(updateBookingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "booking-pending-123" },
          data: expect.objectContaining({
            status: "PAID",
          }),
        })
      );

      // Verifikasi KRUSIAL: tx.property.update dan tx.roomType.update TIDAK dipanggil untuk decrement
      expect(updatePropertySpy).not.toHaveBeenCalled();
      expect(updateRoomTypeSpy).not.toHaveBeenCalled();
    });

    it("menjalankan decrement sebagai safety fallback HANYA jika status booking awal BUKAN PENDING", async () => {
      const mockBookingNonPending = {
        id: "booking-special-456",
        status: "SPECIAL_UNRESERVED",
        amount: 2000000,
        property_id: "prop-beta",
        room_type_id: "room-type-vip",
        property: {
          id: "prop-beta",
          name: "Kos Pasti Beta",
          available_rooms: 5,
          owner: {
            id: "owner-2",
            name: "Ibu Kos",
            whatsapp_number: "081234567899",
          },
        },
        room_type: {
          id: "room-type-vip",
          name: "VIP Room",
          available_rooms: 2,
        },
        user: {
          id: "user-2",
          name: "Dewi",
          whatsapp: "082222222222",
        },
      };

      const updateBookingSpy = vi.fn().mockResolvedValue({
        ...mockBookingNonPending,
        status: "PAID",
      });
      const updatePropertySpy = vi.fn().mockResolvedValue({});
      const updateRoomTypeSpy = vi.fn().mockResolvedValue({});
      const upsertPayoutSpy = vi.fn().mockResolvedValue({});

      const mockTx = {
        booking: {
          update: updateBookingSpy,
        },
        property: {
          update: updatePropertySpy,
        },
        roomType: {
          update: updateRoomTypeSpy,
        },
        payout: {
          upsert: upsertPayoutSpy,
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockBookingNonPending as never);
      vi.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const result = await fulfillPaidBooking({
        bookingId: "booking-special-456",
        paymentMethod: "MANUAL",
      });

      expect(result.success).toBe(true);
      // Fallback: karena tidak di-reserve di muka, kuota kamar dipotong
      expect(updatePropertySpy).toHaveBeenCalledWith({
        where: { id: "prop-beta" },
        data: { available_rooms: { decrement: 1 } },
      });
      expect(updateRoomTypeSpy).toHaveBeenCalledWith({
        where: { id: "room-type-vip" },
        data: { available_rooms: { decrement: 1 } },
      });
    });

    it("menangani idempotensi ketika booking sudah PAID tanpa menyentuh stok kamar", async () => {
      const mockAlreadyPaidBooking = {
        id: "booking-already-paid",
        status: "PAID",
        amount: 1000000,
        property: { id: "prop-1", available_rooms: 3 },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockAlreadyPaidBooking as never);
      const txSpy = vi.spyOn(prisma, "$transaction");

      const result = await fulfillPaidBooking({
        bookingId: "booking-already-paid",
      });

      expect(result.success).toBe(true);
      expect(result.alreadyPaid).toBe(true);
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe("2. Restorasi Stok Kamar pada Pembatalan Kedaluwarsa (> 24 Jam)", () => {
    it("mengembalikan kuota kamar (+1 increment) pada Property dan RoomType saat pesanan PENDING kedaluwarsa", async () => {
      const overdueBookings = [
        {
          id: "expired-book-1",
          property_id: "prop-alpha",
          room_type_id: "room-deluxe",
        },
        {
          id: "expired-book-2",
          property_id: "prop-beta",
          room_type_id: null, // Tanpa room_type spesifik
        },
      ];

      // findMany panggilan pertama: sub-routine 1 (reminder) -> kosong
      // findMany panggilan kedua: sub-routine 2 (overdue bookings)
      vi.spyOn(prisma.booking, "findMany")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(overdueBookings as never);

      const updateManyBookingSpy = vi.fn().mockResolvedValue({ count: 1 });
      const updatePropertySpy = vi.fn().mockResolvedValue({});
      const updateRoomTypeSpy = vi.fn().mockResolvedValue({});
      const updateManyMagicLinkSpy = vi.fn().mockResolvedValue({ count: 1 });

      const mockTx = {
        booking: {
          updateMany: updateManyBookingSpy,
        },
        property: {
          update: updatePropertySpy,
        },
        roomType: {
          update: updateRoomTypeSpy,
        },
        magicLink: {
          updateMany: updateManyMagicLinkSpy,
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const summary = await runPaymentReminderProcess();

      expect(summary.expiredBookingsCancelled).toBe(2);

      // Verifikasi pembatalan booking 1
      expect(updateManyBookingSpy).toHaveBeenCalledWith({
        where: { id: "expired-book-1", status: "PENDING" },
        data: {
          status: "CANCELLED",
          cancellation_reason: "EXPIRED_UNPAID_TIMEOUT",
        },
      });

      // Verifikasi increment kamar Property 1 & RoomType 1
      expect(updatePropertySpy).toHaveBeenCalledWith({
        where: { id: "prop-alpha" },
        data: { available_rooms: { increment: 1 } },
      });
      expect(updateRoomTypeSpy).toHaveBeenCalledWith({
        where: { id: "room-deluxe" },
        data: { available_rooms: { increment: 1 } },
      });

      // Verifikasi pembatalan booking 2 (tanpa room_type)
      expect(updatePropertySpy).toHaveBeenCalledWith({
        where: { id: "prop-beta" },
        data: { available_rooms: { increment: 1 } },
      });
      // roomType update tidak dipanggil untuk booking 2
      expect(updateRoomTypeSpy).toHaveBeenCalledTimes(1);

      // Verifikasi magic link di-nonaktifkan
      expect(updateManyMagicLinkSpy).toHaveBeenCalledWith({
        where: {
          booking_id: "expired-book-1",
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });
    });

    it("tidak mengembalikan kamar jika pesanan sudah dibayar sesaat sebelumnya (status bukan PENDING lagi)", async () => {
      const overdueBooking = [
        {
          id: "expired-race-condition",
          property_id: "prop-gamma",
          room_type_id: null,
        },
      ];

      vi.spyOn(prisma.booking, "findMany")
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(overdueBooking as never);

      // Misal updateMany count: 0 karena status sudah berubah jadi PAID sesaat sebelum cron run
      const updateManyBookingSpy = vi.fn().mockResolvedValue({ count: 0 });
      const updatePropertySpy = vi.fn();
      const updateManyMagicLinkSpy = vi.fn();

      const mockTx = {
        booking: {
          updateMany: updateManyBookingSpy,
        },
        property: {
          update: updatePropertySpy,
        },
        magicLink: {
          updateMany: updateManyMagicLinkSpy,
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const summary = await runPaymentReminderProcess();

      expect(summary.expiredBookingsCancelled).toBe(0);
      expect(updatePropertySpy).not.toHaveBeenCalled();
      expect(updateManyMagicLinkSpy).not.toHaveBeenCalled();
    });
  });
});
