import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/cron/payment-reminder/route";
import { prisma } from "@/lib/prisma";
import * as notificationsLib from "@/lib/notifications";
import * as whatsappLib from "@/lib/whatsapp";

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true, simulated: true }),
  formatWhatsAppNumber: vi.fn((num: string) => num.replace(/\D/g, "")),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notif-1" }),
    },
  },
}));

describe("Payment Reminder Cron Automation - Issue #400", () => {
  const originalEnvCronSecret = process.env.CRON_SECRET;
  const mockCronSecret = "test-secret-payment-reminder-400";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = mockCronSecret;
  });

  afterEach(() => {
    if (originalEnvCronSecret !== undefined) {
      process.env.CRON_SECRET = originalEnvCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  const createRequest = (method: "GET" | "POST" = "POST", authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }
    return new Request("http://localhost:3000/api/cron/payment-reminder", {
      method,
      headers,
    });
  };

  describe("Keamanan & Autentikasi Endpoint", () => {
    it("menolak akses (401) jika CRON_SECRET tidak disetel di environment", async () => {
      delete process.env.CRON_SECRET;
      const req = createRequest("POST", `Bearer ${mockCronSecret}`);

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("menolak akses (401) jika header authorization tidak ada", async () => {
      const req = createRequest("GET");

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("menolak akses (401) jika token tidak cocok", async () => {
      const req = createRequest("POST", "Bearer wrong-secret-token");

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("mengizinkan akses untuk request GET dan POST dengan token yang valid", async () => {
      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce([]) // reminder query
        .mockResolvedValueOnce([]) // overdue query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const getReq = createRequest("GET", `Bearer ${mockCronSecret}`);
      const getRes = await GET(getReq);
      expect(getRes.status).toBe(200);

      const postReq = createRequest("POST", `Bearer ${mockCronSecret}`);
      const postRes = await POST(postReq);
      expect(postRes.status).toBe(200);
    });
  });

  describe("Sub-Routine 1: Pengiriman Pengingat Pembayaran", () => {
    it("mengirim pengingat WhatsApp dan in-app serta menandai payment_reminder_sent_at", async () => {
      const notifySpy = vi.spyOn(notificationsLib, "notifyPaymentReminder").mockResolvedValue();

      const bookingCreatedAt = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 jam lalu
      const mockPendingBookings = [
        {
          id: "book-pending-1",
          student_name: "Ahmad Rizky",
          student_whatsapp: "081234567890",
          status: "PENDING",
          amount: 1200000,
          service_fee: 5000,
          payment_reminder_sent_at: null,
          created_at: bookingCreatedAt,
          user_id: "user-123",
          property: {
            id: "prop-1",
            name: "Kos Graha Subang Asri",
          },
          room_type: {
            id: "rt-1",
            name: "Kamar Standar AC",
          },
        },
      ];

      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce(mockPendingBookings as never) // Sub-routine 1
        .mockResolvedValueOnce([]); // Sub-routine 2

      vi.mocked(prisma.booking.update).mockResolvedValue({} as never);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.summary.remindersSent).toBe(1);

      // Verifikasi pemanggilan notifyPaymentReminder
      expect(notifySpy).toHaveBeenCalledTimes(1);
      expect(notifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantName: "Ahmad Rizky",
          tenantWhatsapp: "081234567890",
          propertyName: "Kos Graha Subang Asri",
          roomTypeName: "Kamar Standar AC",
          amount: 1205000, // 1.200.000 + 5.000 service fee
          bookingId: "book-pending-1",
          userId: "user-123",
        })
      );

      // Verifikasi update idempotensi payment_reminder_sent_at
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "book-pending-1" },
          data: expect.objectContaining({
            payment_reminder_sent_at: expect.any(Date),
          }),
        })
      );

      notifySpy.mockRestore();
    });

    it("melanjutkan pengiriman meskipun salah satu booking mengalami kegagalan", async () => {
      const notifySpy = vi
        .spyOn(notificationsLib, "notifyPaymentReminder")
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce();

      const mockBookings = [
        {
          id: "book-err-1",
          student_name: "Budi",
          student_whatsapp: "08111",
          amount: 1000000,
          service_fee: 5000,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
          property: { name: "Kos A" },
          room_type: null,
          user_id: null,
        },
        {
          id: "book-ok-2",
          student_name: "Siti",
          student_whatsapp: "08222",
          amount: 1500000,
          service_fee: 5000,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
          property: { name: "Kos B" },
          room_type: null,
          user_id: null,
        },
      ];

      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce(mockBookings as never)
        .mockResolvedValueOnce([]);

      vi.mocked(prisma.booking.update).mockResolvedValue({} as never);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.summary.remindersSent).toBe(1); // Hanya 1 yang sukses
      expect(prisma.booking.update).toHaveBeenCalledTimes(1);

      notifySpy.mockRestore();
    });
  });

  describe("Sub-Routine 2: Pembersihan Pesanan Kedaluwarsa (> 24 Jam)", () => {
    it("otomatis membatalkan pesanan PENDING yang usianya sudah melewati 24 jam", async () => {
      const mockOverdue = [
        { id: "overdue-1" },
        { id: "overdue-2" },
      ];

      vi.mocked(prisma.booking.findMany)
        .mockResolvedValueOnce([]) // Sub-routine 1 tidak ada reminder baru
        .mockResolvedValueOnce(mockOverdue as never); // Sub-routine 2 ada 2 overdue

      vi.mocked(prisma.booking.update).mockResolvedValue({} as never);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.summary.expiredBookingsCancelled).toBe(2);

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: "overdue-1" },
        data: {
          status: "CANCELLED",
          cancellation_reason: "EXPIRED_UNPAID_TIMEOUT",
        },
      });

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: "overdue-2" },
        data: {
          status: "CANCELLED",
          cancellation_reason: "EXPIRED_UNPAID_TIMEOUT",
        },
      });
    });
  });

  describe("Format Notifikasi & Anti-Slop Verification", () => {
    it("mengirim pesan WhatsApp pengingat yang ramah, memuat tautan checkout, dan bebas dari emoji AI slop", async () => {
      const { notifyPaymentReminder } = await import("@/lib/notifications");

      const sendWaMock = vi.mocked(whatsappLib.sendWhatsAppMessage);

      await notifyPaymentReminder({
        tenantName: "Dimas Ferial",
        tenantWhatsapp: "081234567890",
        propertyName: "Kos Pasti Nyaman",
        roomTypeName: "Deluxe AC",
        amount: 1505000,
        bookingId: "b-unique-12345",
        createdAt: new Date(),
        userId: "user-123",
      });

      expect(sendWaMock).toHaveBeenCalledTimes(1);
      const callArgs = sendWaMock.mock.calls[0][0];

      // Verifikasi isi pesan WhatsApp
      expect(callArgs.to).toBe("081234567890");
      expect(callArgs.message).toContain("Halo Dimas Ferial");
      expect(callArgs.message).toContain("Kos Pasti Nyaman");
      expect(callArgs.message).toContain("Deluxe AC");
      expect(callArgs.message).toContain("1.505.000");
      expect(callArgs.message).toContain("/checkout/b-unique-12345");

      // Verifikasi Anti-Slop: Tidak boleh ada emoji mentah alay
      const forbiddenEmojis = ["⏰", "💰", "⭐", "🌟", "🚀", "✨", "💸", "🤑"];
      for (const emoji of forbiddenEmojis) {
        expect(callArgs.message).not.toContain(emoji);
      }
    });
  });
});
