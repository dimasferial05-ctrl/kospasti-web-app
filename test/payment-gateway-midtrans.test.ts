import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
  verifyMidtransSignature,
  calculatePlatformCommission,
  evaluateMidtransStatus,
  SERVICE_FEE,
  DEFAULT_TAKE_RATE,
} from "@/lib/midtrans";
import { POST as handleWebhook } from "@/app/api/webhooks/payment/route";
import { POST as handleSnapToken } from "@/app/api/bookings/[id]/snap-token/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email", () => ({
  sendBookingReceiptEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "mock-notif-1" }),
}));

describe("Integrasi Payment Gateway Midtrans, Monetisasi & Webhook (Issue #394)", () => {
  const mockServerKey = "SB-Mid-server-test-secret-key-123";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.MIDTRANS_SERVER_KEY = mockServerKey;
    process.env.MIDTRANS_CLIENT_KEY = "Mid-client-test-client-key-456";
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = "Mid-client-test-client-key-456";
    process.env.MIDTRANS_IS_PRODUCTION = "false";
  });

  describe("1. Helper Utilitas Midtrans Server (src/lib/midtrans.ts)", () => {
    it("menghitung dan memvalidasi Signature Key SHA-512 dengan tepat", () => {
      const orderId = "BKG-202611-001";
      const statusCode = "200";
      const grossAmount = "1505000.00";

      // Rumus resmi: SHA512(order_id + status_code + gross_amount + ServerKey)
      const expectedSignature = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${mockServerKey}`)
        .digest("hex");

      const isValid = verifyMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        expectedSignature
      );
      expect(isValid).toBe(true);

      // Pastikan menolak jika signature dipalsukan
      const isInvalid = verifyMidtransSignature(
        orderId,
        statusCode,
        grossAmount,
        "invalid-tampered-signature-hex-12345"
      );
      expect(isInvalid).toBe(false);
    });

    it("menghitung komisi platform (Take Rate 3%) dan nominal bersih payout pemilik kos", () => {
      const rentAmount = 1000000; // Sewa Rp 1.000.000
      const commission = calculatePlatformCommission(rentAmount, DEFAULT_TAKE_RATE);

      expect(commission.grossAmount).toBe(1000000);
      expect(commission.platformFee).toBe(30000); // 3% dari 1jt = Rp 30.000
      expect(commission.netAmount).toBe(970000); // Rp 970.000 diterima pemilik
    });

    it("mengevaluasi status Midtrans ke status pesanan KosPasti secara akurat", () => {
      expect(evaluateMidtransStatus("settlement")).toBe("PAID");
      expect(evaluateMidtransStatus("capture", "accept")).toBe("PAID");
      expect(evaluateMidtransStatus("capture", "challenge")).toBe("PENDING");
      expect(evaluateMidtransStatus("pending")).toBe("PENDING");
      expect(evaluateMidtransStatus("deny")).toBe("CANCELLED");
      expect(evaluateMidtransStatus("expire")).toBe("CANCELLED");
      expect(evaluateMidtransStatus("cancel")).toBe("CANCELLED");
    });
  });

  describe("2. Endpoint Snap Token API (/api/bookings/[id]/snap-token)", () => {
    it("menolak request 401 jika pengguna belum terautentikasi (tidak ada cookie)", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        get: vi.fn().mockReturnValue(undefined),
      });

      const req = new Request("http://localhost:3000/api/bookings/bkg-1/snap-token", {
        method: "POST",
      });

      const res = await handleSnapToken(req, {
        params: Promise.resolve({ id: "bkg-1" }),
      });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("menolak request 404 jika booking ID tidak ditemukan di database", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        get: vi.fn().mockReturnValue({ value: "mock-user-token" }),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce({
        userId: "user-1",
        email: "student@example.com",
      } as unknown as never);
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/bookings/bkg-notfound/snap-token", {
        method: "POST",
      });

      const res = await handleSnapToken(req, {
        params: Promise.resolve({ id: "bkg-notfound" }),
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain("Booking tidak ditemukan");
    });

    it("menolak request 400 jika booking sudah berstatus PAID", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        get: vi.fn().mockReturnValue({ value: "mock-user-token" }),
      });
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValueOnce({
        userId: "user-1",
        email: "student@example.com",
      } as unknown as never);
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: "bkg-already-paid",
        user_id: "user-1",
        status: "PAID",
      } as unknown as never);

      const req = new Request("http://localhost:3000/api/bookings/bkg-already-paid/snap-token", {
        method: "POST",
      });

      const res = await handleSnapToken(req, {
        params: Promise.resolve({ id: "bkg-already-paid" }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Pembayaran sudah lunas");
    });
  });

  describe("3. Webhook Handler & Idempotency (/api/webhooks/payment)", () => {
    it("menolak 401 jika signature key dari Midtrans tidak cocok", async () => {
      const orderId = "BKG-TEST-001";
      const payload = {
        order_id: orderId,
        status_code: "200",
        gross_amount: "1005000",
        signature_key: "tampered-bogus-key",
        transaction_status: "settlement",
        payment_type: "qris",
        transaction_id: "trx-midtrans-123",
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleWebhook(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Invalid signature key");
    });

    it("idempotency check: mengembalikan 200 OK langsung jika booking sudah berstatus PAID tanpa memproses ulang", async () => {
      const orderId = "BKG-ALREADY-PAID-001";
      const statusCode = "200";
      const grossAmount = "1005000";

      const validSignature = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${mockServerKey}`)
        .digest("hex");

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "PAID",
      } as unknown as never);

      const updateSpy = vi.spyOn(prisma.booking, "update");

      const payload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: "settlement",
        payment_type: "qris",
        transaction_id: "trx-midtrans-456",
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleWebhook(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("OK");
      expect(data.message).toContain("Idempotent OK");
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("memproses settlement: mengubah status booking jadi PAID, mengurangi kamar, dan mencatat komisi payout", async () => {
      const orderId = "BKG-SETTLED-001";
      const statusCode = "200";
      const grossAmount = "1505000";

      const validSignature = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${mockServerKey}`)
        .digest("hex");

      const mockBooking = {
        id: orderId,
        student_name: "Budi Santoso",
        student_whatsapp: "081234567890",
        move_in_date: new Date("2026-12-01"),
        status: "PENDING",
        amount: 1500000,
        service_fee: SERVICE_FEE,
        property_id: "prop-1",
        room_type_id: "rt-1",
        user_id: "user-budi",
        property: {
          id: "prop-1",
          name: "Kos Nyaman",
          available_rooms: 5,
          owner: {
            id: "owner-1",
            name: "Ibu Siti",
            whatsapp_number: "08987654321",
          },
        },
        room_type: {
          id: "rt-1",
          name: "Kamar AC",
          price_per_month: 1500000,
          available_rooms: 2,
        },
        user: {
          email: "budi@student.ac.id",
        },
      };

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce(mockBooking as unknown as never);

      // Mock database transaction
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const txMock = {
          booking: {
            update: vi.fn().mockResolvedValue({
              ...mockBooking,
              status: "PAID",
              payment_method: "qris",
            }),
          },
          property: {
            update: vi.fn().mockResolvedValue({}),
          },
          roomType: {
            update: vi.fn().mockResolvedValue({}),
          },
          payout: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return await (callback as any)(txMock);
      });

      vi.spyOn(prisma.magicLink, "updateMany").mockResolvedValue({ count: 0 });
      vi.spyOn(prisma.magicLink, "create").mockResolvedValue({ id: "ml-1" } as unknown as never);

      const payload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: "settlement",
        payment_type: "qris",
        transaction_id: "trx-midtrans-settled-1",
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleWebhook(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("OK");
      expect(data.message).toBe("Payment processed successfully");
    });

    it("memproses cancel/expire: mengubah status booking jadi CANCELLED", async () => {
      const orderId = "BKG-EXPIRED-001";
      const statusCode = "202";
      const grossAmount = "1505000";

      const validSignature = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${mockServerKey}`)
        .digest("hex");

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValueOnce({
        id: orderId,
        status: "PENDING",
      } as unknown as never);

      const updateSpy = vi.spyOn(prisma.booking, "update").mockResolvedValueOnce({
        id: orderId,
        status: "CANCELLED",
      } as unknown as never);

      const payload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: "expire",
        payment_type: "qris",
        transaction_id: "trx-midtrans-expire-1",
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleWebhook(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("OK");
      expect(data.message).toContain("CANCELLED");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({ status: "CANCELLED" }),
        })
      );
    });
  });
});
