import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/cron/booking-lifecycle/route";
import { prisma } from "@/lib/prisma";
import * as whatsappLib from "@/lib/whatsapp";
import * as emailLib from "@/lib/email";

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-email-id" }),
  sendMoveInReminderEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-email-reminder" }),
  sendReviewPromptEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-email-review" }),
  generateMoveInReminderHtml: vi.fn().mockReturnValue("<p>mock</p>"),
  generateReviewPromptHtml: vi.fn().mockReturnValue("<p>mock</p>"),
}));

describe("Booking Lifecycle Automation Cron (Issue #374)", () => {
  const originalEnvCronSecret = process.env.CRON_SECRET;
  const mockCronSecret = "test-cron-secret-booking-lifecycle-374";

  beforeEach(() => {
    vi.restoreAllMocks();
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
    return new Request("http://localhost:3000/api/cron/booking-lifecycle", {
      method,
      headers,
    });
  };

  describe("Keamanan & Autentikasi Endpoint", () => {
    it("Menolak (401) jika CRON_SECRET tidak disetel di environment", async () => {
      delete process.env.CRON_SECRET;
      const req = createRequest("POST", `Bearer ${mockCronSecret}`);

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("Menolak (401) jika header authorization tidak disertakan", async () => {
      const req = createRequest("GET");

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("Menolak (401) jika token tidak cocok", async () => {
      const req = createRequest("POST", "Bearer wrong-token-xyz");

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });
  });

  describe("Sub-routine 1: Pengingat H-1 Masuk Kos (Automated Reminder)", () => {
    it("Mengirim WA & Email reminder untuk booking yang akan masuk besok dan mengupdate reminder_sent_at", async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const mockReminderBooking = {
        id: "b-reminder-1",
        student_name: "Dimas Ferial",
        student_whatsapp: "081234567890",
        move_in_date: tomorrow,
        status: "APPROVED",
        reminder_sent_at: null,
        property: {
          id: "p-1",
          name: "Kos Pasti Nyaman",
          address: "Jl. Kaliurang KM 5",
          owner: {
            name: "Ibu Nur",
            whatsapp_number: "081987654321",
          },
        },
        room_type: {
          name: "Deluxe A",
        },
        user: {
          email: "dimas@example.com",
        },
      };

      // Mock prisma queries:
      // 1. Reminder findMany returns mockReminderBooking
      // 2. Overdue checkin findMany returns []
      // 3. Review prompt findMany returns []
      // 4. processReadyPayouts finds readyBookings returns []
      vi.spyOn(prisma.booking, "findMany").mockImplementation(async (args: any) => {
        if (args?.where?.reminder_sent_at === null) {
          return [mockReminderBooking] as any;
        }
        return [] as any;
      });

      const updateSpy = vi.spyOn(prisma.booking, "update").mockResolvedValue({} as any);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.remindersSent).toBe(1);

      // Pastikan WA terkirim
      expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081234567890",
          message: expect.stringContaining("Besok adalah jadwal kamu mulai menempati kamar"),
        })
      );

      // Pastikan Email terkirim
      expect(emailLib.sendMoveInReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          studentEmail: "dimas@example.com",
          studentName: "Dimas Ferial",
          propertyName: "Kos Pasti Nyaman",
        })
      );

      // Pastikan reminder_sent_at diupdate
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "b-reminder-1" },
          data: expect.objectContaining({
            reminder_sent_at: expect.any(Date),
          }),
        })
      );
    });

    it("Idempotensi: Tidak mengirim pengingat jika reminder_sent_at sudah terisi", async () => {
      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([] as any);
      const updateSpy = vi.spyOn(prisma.booking, "update");

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.remindersSent).toBe(0);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Sub-routine 2: Auto Check-in & Pelepasan Dana Escrow", () => {
    it("Melakukan auto check-in pada booking yang lewat 12 jam dari tanggal masuk", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const mockOverdueBooking = {
        id: "b-auto-checkin-1",
        student_name: "Mahasiswa Santoso",
        student_whatsapp: "081333444555",
        move_in_date: yesterday,
        status: "APPROVED",
        checkin_confirmed_at: null,
        property: {
          name: "Kos Eksklusif Melati",
        },
      };

      vi.spyOn(prisma.booking, "findMany").mockImplementation(async (args: any) => {
        if (args?.where?.checkin_confirmed_at === null && args?.where?.move_in_date?.lte) {
          return [mockOverdueBooking] as any;
        }
        return [] as any;
      });

      const updateSpy = vi.spyOn(prisma.booking, "update").mockResolvedValue({} as any);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.autoCheckins).toBe(1);

      // Pastikan booking diupdate menjadi COMPLETED dengan checkin_confirmed_at terisi
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "b-auto-checkin-1" },
          data: expect.objectContaining({
            status: "COMPLETED",
            checkin_confirmed_at: expect.any(Date),
          }),
        })
      );

      // Pastikan WA konfirmasi check-in terkirim ke mahasiswa
      expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081333444555",
          message: expect.stringContaining("Mitra mengonfirmasi bahwa kamu sudah check-in"),
        })
      );
    });

    it("Melepaskan dana escrow (PAYOUT_PENDING) setelah masa garansi 12 jam habis dan notifikasi mitra", async () => {
      const eighteenHoursAgo = new Date(Date.now() - 18 * 60 * 60 * 1000);

      const mockCompletedBooking = {
        id: "b-escrow-1",
        student_name: "Ahmad Rizky",
        amount: 1500000,
        status: "COMPLETED",
        checkin_confirmed_at: eighteenHoursAgo,
        payout: null,
        property: {
          name: "Kos Graha Mulia",
          owner_id: "owner-1",
          owner: {
            id: "owner-1",
            name: "Pak Bambang",
            whatsapp_number: "081299887766",
          },
        },
        room_type: {
          price_per_month: 1500000,
        },
      };

      vi.spyOn(prisma.booking, "findMany").mockImplementation(async (args: any) => {
        if (args?.where?.status === "COMPLETED" && args?.where?.payout === null) {
          return [mockCompletedBooking] as any;
        }
        return [] as any;
      });

      vi.spyOn(prisma, "$transaction").mockResolvedValue([{}, {}] as any);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.escrowReleased).toBe(1);

      // Notifikasi WA pelepasan escrow terkirim ke mitra kos
      expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081299887766",
          message: expect.stringContaining("Dana sewa sebesar"),
        })
      );
    });
  });

  describe("Sub-routine 3: Pemicu Ulasan Otomatis (Review Prompt Hari ke-2)", () => {
    it("Mengirim WA & Email ajakan ulasan pada hari ke-2 (>= 48 jam) pasca check-in dan mengupdate review_prompted_at", async () => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);

      const mockReviewPromptBooking = {
        id: "b-review-1",
        student_name: "Citra Lestari",
        student_whatsapp: "081777888999",
        status: "COMPLETED",
        checkin_confirmed_at: fiftyHoursAgo,
        review: null,
        review_prompted_at: null,
        property_id: "p-prop-1",
        property: {
          name: "Kos Melati Asri",
        },
        user: {
          email: "citra@example.com",
        },
      };

      vi.spyOn(prisma.booking, "findMany").mockImplementation(async (args: any) => {
        if (args?.where?.review === null && args?.where?.review_prompted_at === null) {
          return [mockReviewPromptBooking] as any;
        }
        return [] as any;
      });

      const updateSpy = vi.spyOn(prisma.booking, "update").mockResolvedValue({} as any);

      const req = createRequest("POST", `Bearer ${mockCronSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.reviewPromptsSent).toBe(1);

      // Pastikan WA prompt ulasan terkirim
      expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "081777888999",
          message: expect.stringContaining("Sudah 2 hari nih kamu tinggal di"),
        })
      );

      // Pastikan Email prompt ulasan terkirim
      expect(emailLib.sendReviewPromptEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          studentEmail: "citra@example.com",
          studentName: "Citra Lestari",
          propertyName: "Kos Melati Asri",
        })
      );

      // Pastikan review_prompted_at diupdate
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "b-review-1" },
          data: expect.objectContaining({
            review_prompted_at: expect.any(Date),
          }),
        })
      );
    });

    it("Idempotensi: Tidak mengirim prompt ulasan jika review_prompted_at sudah terisi", async () => {
      vi.spyOn(prisma.booking, "findMany").mockResolvedValue([] as any);
      const updateSpy = vi.spyOn(prisma.booking, "update");

      const req = createRequest("GET", `Bearer ${mockCronSecret}`);
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.summary.reviewPromptsSent).toBe(0);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});

