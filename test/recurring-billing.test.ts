import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/cron/billing-invoices/route";
import { POST as webhookPOST } from "@/app/api/webhooks/payment/route";
import {
  generateMonthlyInvoices,
  sendDueBillingReminders,
  markOverdueInvoices,
  runRecurringBillingProcess,
  calculateNextPeriodDueDate,
} from "@/lib/recurring-billing-processor";
import { prisma } from "@/lib/prisma";
import * as whatsappLib from "@/lib/whatsapp";
import * as midtransLib from "@/lib/midtrans";
import * as notificationsLib from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-123" }),
}));

vi.mock("@/lib/midtrans", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/midtrans")>();
  return {
    ...actual,
    createSnapTransaction: vi.fn().mockResolvedValue({
      token: "snap-mock-token-xyz",
      redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-mock-token-xyz",
    }),
  };
});

describe("Sistem Penagihan & Invoice Sewa Bulanan Otomatis (Recurring Billing)", () => {
  const originalEnvCronSecret = process.env.CRON_SECRET;
  const originalServerKey = process.env.MIDTRANS_SERVER_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret-2026";
    process.env.MIDTRANS_SERVER_KEY = "test-server-key";
  });

  afterEach(() => {
    if (originalEnvCronSecret !== undefined) {
      process.env.CRON_SECRET = originalEnvCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }

    if (originalServerKey !== undefined) {
      process.env.MIDTRANS_SERVER_KEY = originalServerKey;
    } else {
      delete process.env.MIDTRANS_SERVER_KEY;
    }
  });

  describe("1. Otorisasi Endpoint Cron (/api/cron/billing-invoices)", () => {
    it("menolak request (401) jika header Authorization tidak disertakan", async () => {
      const req = new Request("http://localhost:3000/api/cron/billing-invoices", {
        method: "GET",
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("menolak request (401) jika header Authorization memiliki token yang salah", async () => {
      const req = new Request("http://localhost:3000/api/cron/billing-invoices", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-secret-token",
        },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("mengizinkan request (200) jika Authorization Bearer cocok dengan CRON_SECRET", async () => {
      // Mock prisma calls
      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([] as any);
      vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([] as any);
      vi.spyOn(prisma.invoice, "updateMany").mockResolvedValue({ count: 0 } as any);

      const req = new Request("http://localhost:3000/api/cron/billing-invoices", {
        method: "GET",
        headers: {
          authorization: "Bearer test-cron-secret-2026",
        },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.invoicesCreated).toBe(0);
    });
  });

  describe("2. Logika Pembuatan Tagihan Bulanan (generateMonthlyInvoices)", () => {
    it("menghitung tanggal jatuh tempo periode berikutnya secara akurat", () => {
      const baseDate = new Date("2026-08-15T00:00:00.000Z");
      const month2 = calculateNextPeriodDueDate(baseDate, 1);
      expect(month2.getMonth()).toBe(8); // September (0-indexed: 8)
      expect(month2.getDate()).toBe(15);
    });

    it("membuat Invoice baru untuk booking aktif dengan komisi 3% dan Snap Pay URL", async () => {
      const refDate = new Date("2026-09-08T00:00:00.000Z");
      const moveInDate = new Date("2026-08-15T00:00:00.000Z");

      const mockBooking = {
        id: "booking-active-123",
        property_id: "prop-456",
        student_name: "Ahmad Mahasiswa",
        student_whatsapp: "081234567890",
        move_in_date: moveInDate,
        amount: 1000000,
        user_id: "user-789",
        property: {
          id: "prop-456",
          name: "Kos Mawar Indah",
          price_per_month: 1000000,
          owner_id: "owner-999",
          owner: { id: "owner-999", name: "Ibu Kos", whatsapp_number: "0811111111" },
        },
        room_type: {
          id: "room-type-1",
          name: "Kamar Deluxe",
          price_per_month: 1000000,
        },
        user: { id: "user-789", email: "ahmad@example.com" },
        invoices: [], // Belum ada invoice bulan ke-2
      };

      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([mockBooking as any]);
      const createInvoiceSpy = vi
        .spyOn(prisma.invoice, "create")
        .mockResolvedValue({ id: "inv-new-1" } as any);

      const result = await generateMonthlyInvoices(refDate);

      expect(result.createdCount).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(createInvoiceSpy).toHaveBeenCalledTimes(1);

      const createArg = createInvoiceSpy.mock.calls[0][0].data;
      expect(createArg.booking_id).toBe("booking-active-123");
      expect(createArg.month_period).toBe(2);
      expect(createArg.amount).toBe(1000000);
      // Komisi platform 3% dari Rp 1.000.000 = Rp 30.000
      expect(createArg.platform_fee).toBe(30000);
      expect(createArg.service_fee).toBe(5000);
      expect(createArg.total_amount).toBe(1005000);
      expect(createArg.net_owner_amount).toBe(970000);
      expect(createArg.status).toBe("PENDING");
      expect(createArg.snap_token).toBe("snap-mock-token-xyz");
      expect(createArg.snap_redirect_url).toContain("midtrans.com");
    });

    it("mencegah duplikasi (idempotent): tidak membuat invoice jika periode bulan sudah terbit", async () => {
      const refDate = new Date("2026-09-08T00:00:00.000Z");
      const moveInDate = new Date("2026-08-15T00:00:00.000Z");

      const mockBookingWithInvoice = {
        id: "booking-active-123",
        property_id: "prop-456",
        student_name: "Ahmad Mahasiswa",
        student_whatsapp: "081234567890",
        move_in_date: moveInDate,
        amount: 1000000,
        user_id: "user-789",
        property: {
          id: "prop-456",
          name: "Kos Mawar Indah",
          price_per_month: 1000000,
          owner_id: "owner-999",
        },
        room_type: null,
        user: null,
        invoices: [
          {
            id: "inv-existing-period-2",
            month_period: 2,
            status: "PENDING",
          },
        ],
      };

      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([mockBookingWithInvoice as any]);
      const createInvoiceSpy = vi.spyOn(prisma.invoice, "create");

      const result = await generateMonthlyInvoices(refDate);

      expect(result.createdCount).toBe(0);
      expect(createInvoiceSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. Pengiriman Notifikasi & Pengingat Tagihan (sendDueBillingReminders)", () => {
    it("mengirimkan notifikasi WhatsApp H-7 dengan Snap Pay URL langsung", async () => {
      const refDate = new Date("2026-09-08T00:00:00.000Z");
      const dueDateH7 = new Date("2026-09-15T00:00:00.000Z"); // Tepat 7 hari ke depan

      const mockInvoice = {
        id: "inv-h7-123",
        month_period: 2,
        total_amount: 1005000,
        due_date: dueDateH7,
        status: "PENDING",
        reminder_h7_sent_at: null,
        reminder_h3_sent_at: null,
        snap_redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-h7",
        user_id: "user-tenant-1",
        booking: {
          student_name: "Budi Santoso",
          student_whatsapp: "081987654321",
          property: { name: "Kos Melati Putri" },
          user: { email: "budi@example.com" },
        },
        owner: { name: "Pak Haji" },
      };

      vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([mockInvoice as any]);
      const updateInvoiceSpy = vi.spyOn(prisma.invoice, "update").mockResolvedValue({} as any);
      const waSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");
      const notifSpy = vi.spyOn(notificationsLib, "createInAppNotification");

      const result = await sendDueBillingReminders(refDate);

      expect(result.remindersH7Sent).toBe(1);
      expect(result.remindersH3Sent).toBe(0);
      expect(waSpy).toHaveBeenCalledTimes(1);
      expect(waSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081987654321",
          message: expect.stringContaining("https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-h7"),
        })
      );
      expect(notifSpy).toHaveBeenCalledTimes(1);
      expect(updateInvoiceSpy).toHaveBeenCalledWith({
        where: { id: "inv-h7-123" },
        data: { reminder_h7_sent_at: refDate },
      });
    });

    it("mengirimkan pengingat mendesak H-3 jika jatuh tempo 3 hari ke depan", async () => {
      const refDate = new Date("2026-09-12T00:00:00.000Z");
      const dueDateH3 = new Date("2026-09-15T00:00:00.000Z"); // Tepat 3 hari ke depan

      const mockInvoice = {
        id: "inv-h3-123",
        month_period: 2,
        total_amount: 1005000,
        due_date: dueDateH3,
        status: "PENDING",
        reminder_h7_sent_at: new Date("2026-09-08"),
        reminder_h3_sent_at: null,
        snap_redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-h3",
        user_id: "user-tenant-1",
        booking: {
          student_name: "Budi Santoso",
          student_whatsapp: "081987654321",
          property: { name: "Kos Melati Putri" },
          user: { email: "budi@example.com" },
        },
        owner: { name: "Pak Haji" },
      };

      vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([mockInvoice as any]);
      const updateInvoiceSpy = vi.spyOn(prisma.invoice, "update").mockResolvedValue({} as any);
      const waSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");

      const result = await sendDueBillingReminders(refDate);

      expect(result.remindersH3Sent).toBe(1);
      expect(waSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081987654321",
          message: expect.stringContaining("Pengingat Jatuh Tempo"),
        })
      );
      expect(updateInvoiceSpy).toHaveBeenCalledWith({
        where: { id: "inv-h3-123" },
        data: { reminder_h3_sent_at: refDate },
      });
    });
  });

  describe("4. Penanganan Status Overdue (markOverdueInvoices)", () => {
    it("menandai invoice PENDING yang melewati tanggal jatuh tempo menjadi OVERDUE", async () => {
      const refDate = new Date("2026-09-16T00:00:00.000Z");
      const updateManySpy = vi
        .spyOn(prisma.invoice, "updateMany")
        .mockResolvedValue({ count: 3 } as any);

      const result = await markOverdueInvoices(refDate);

      expect(result.overdueMarked).toBe(3);
      expect(updateManySpy).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          due_date: {
            lt: refDate,
          },
        },
        data: {
          status: "OVERDUE",
        },
      });
    });
  });

  describe("5. Master Runner Routine (runRecurringBillingProcess)", () => {
    it("menjalankan seluruh pipeline penagihan secara terintegrasi", async () => {
      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([] as any);
      vi.spyOn(prisma.invoice, "findMany").mockResolvedValue([] as any);
      vi.spyOn(prisma.invoice, "updateMany").mockResolvedValue({ count: 1 } as any);

      const summary = await runRecurringBillingProcess(new Date());

      expect(summary).toBeDefined();
      expect(summary.invoicesCreated).toBe(0);
      expect(summary.overdueMarked).toBe(1);
      expect(summary.errors).toHaveLength(0);
    });
  });

  describe("6. Integrasi Webhook Pelunasan Invoice (/api/webhooks/payment)", () => {
    it("memproses pembayaran invoice berawalan INV__ dan menandai status PAID", async () => {
      const orderId = "INV__inv-uuid-12345";
      const statusCode = "200";
      const grossAmount = "1005000.00";
      const serverKey = "test-server-key";

      // Hitung SHA-512 signature yang valid
      const crypto = await import("crypto");
      const signatureKey = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");

      const mockInvoice = {
        id: "inv-uuid-12345",
        invoice_number: "INV-202609-XYZ",
        month_period: 2,
        total_amount: 1005000,
        status: "PENDING",
        booking: {
          student_name: "Dimas Student",
          student_whatsapp: "081234567890",
          property: { name: "Kos Melati" },
        },
        owner: { id: "owner-1" },
      };

      vi.spyOn(prisma.invoice, "findFirst").mockResolvedValue(mockInvoice as any);
      const updateSpy = vi.spyOn(prisma.invoice, "update").mockResolvedValue({} as any);
      const waSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");

      const payload = {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: "settlement",
        payment_type: "qris",
        transaction_id: "trx-midtrans-999",
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await webhookPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("OK");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-uuid-12345" },
          data: expect.objectContaining({
            status: "PAID",
            payment_method: "qris",
            payment_gateway_ref: "trx-midtrans-999",
          }),
        })
      );
      expect(waSpy).toHaveBeenCalled();
    });
  });
});
