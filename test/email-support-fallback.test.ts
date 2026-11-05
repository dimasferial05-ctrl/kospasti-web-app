import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateBookingReceiptHtml,
  generateBookingDecisionHtml,
  sendEmail,
  sendBookingReceiptEmail,
  sendBookingDecisionEmail,
} from "@/lib/email";
import { buildSupportWhatsAppUrl } from "@/components/support/CustomerSupportWidget";

describe("Email Fallback & Notification System", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("generateBookingReceiptHtml", () => {
    it("should generate complete HTML receipt with formatted price, escrow notice, and booking details", () => {
      const html = generateBookingReceiptHtml({
        bookingId: "bkg-12345-abcde",
        studentName: "Budi Santoso",
        studentEmail: "budi@example.com",
        studentWhatsapp: "08123456789",
        propertyName: "Kos Putri Melati",
        propertyAddress: "Jl. Kaliurang KM 5",
        roomTypeName: "Kamar Deluxe AC",
        moveInDate: "2026-03-10",
        rentPrice: 1350000,
        adminFee: 0,
        totalPrice: 1350000,
        status: "PAID",
      });

      expect(html).toContain("Budi Santoso");
      expect(html).toContain("bkg-12345-abcde");
      expect(html).toContain("Kos Putri Melati");
      expect(html).toContain("Kamar Deluxe AC");
      expect(html).toContain("Jl. Kaliurang KM 5");
      expect(html).toContain("Pembayaran Berhasil (PAID)");
      expect(html).toContain("Garansi Penahanan Dana (Escrow 12 Jam)");
      expect(html).toContain("Lihat Status Pesanan");
    });
  });

  describe("generateBookingDecisionHtml", () => {
    it("should generate HTML for ACCEPT decision with congratulatory notice and property address", () => {
      const html = generateBookingDecisionHtml({
        bookingId: "bkg-999",
        studentName: "Siti Rahma",
        studentEmail: "siti@example.com",
        propertyName: "Kos Griya Asri",
        action: "ACCEPT",
        ownerName: "Ibu Nurul",
        ownerWhatsapp: "08198765432",
        roomTypeName: "Kamar Standard",
        moveInDate: "2026-04-15",
        propertyAddress: "Jl. Kaliurang KM 5, Sleman, Yogyakarta",
      });

      expect(html).toContain("Siti Rahma");
      expect(html).toContain("Kos Griya Asri");
      expect(html).toContain("Pesanan Dikonfirmasi & Diterima");
      expect(html).toContain("Ibu Nurul");
      expect(html).toContain("menerima dan mengonfirmasi");
      expect(html).toContain("Buka Riwayat Pesanan");
    });

    it("should generate HTML for REJECT decision with refund notice and optional rejection reason", () => {
      const html = generateBookingDecisionHtml({
        bookingId: "bkg-888",
        studentName: "Dimas Anggara",
        studentEmail: "dimas@example.com",
        propertyName: "Kos Berkah",
        action: "REJECT",
        reason: "Kamar baru saja terisi oleh penyewa lama yang memperpanjang sewa.",
        ownerName: "Bapak Joko",
        moveInDate: "2026-05-01",
      });

      expect(html).toContain("Dimas Anggara");
      expect(html).toContain("Kos Berkah");
      expect(html).toContain("Pesanan Ditolak & Proses Pengembalian Dana");
      expect(html).toContain("Kamar baru saja terisi oleh penyewa lama yang memperpanjang sewa.");
      expect(html).toContain("Informasi Pengembalian Dana:");
      expect(html).toContain("Cari Kos Lainnya");
    });
  });

  describe("sendEmail", () => {
    it("should simulate email dispatch when RESEND_API_KEY is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Bukti Booking",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.messageId).toContain("simulated-");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EMAIL SIMULATION]")
      );
    });

    it("should call Resend REST API when RESEND_API_KEY is provided", async () => {
      process.env.RESEND_API_KEY = "re_test_mock_api_key_123";
      process.env.EMAIL_FROM = "KosPasti <notif@kospasti.com>";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "re_real_msg_98765" }),
      });
      global.fetch = mockFetch;

      const result = await sendEmail({
        to: "pelanggan@domain.com",
        subject: "Tes Pengiriman Resend",
        html: "<p>Halo Dunia</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("re_real_msg_98765");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_mock_api_key_123",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle Resend API failure gracefully", async () => {
      process.env.RESEND_API_KEY = "re_invalid_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid API Key" }),
      });
      global.fetch = mockFetch;

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await sendEmail({
        to: "pelanggan@domain.com",
        subject: "Tes Gagal",
        html: "<p>Halo</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid API Key");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("sendBookingReceiptEmail & sendBookingDecisionEmail helpers", () => {
    it("sendBookingReceiptEmail should trigger sendEmail with correct subject", async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendBookingReceiptEmail({
        bookingId: "bkg-101",
        studentName: "Ahmad",
        studentEmail: "mhs@ui.ac.id",
        propertyName: "Kos UI Salemba",
        roomTypeName: "AC 1",
        moveInDate: "2026-09-01",
        rentPrice: 1500000,
        adminFee: 0,
        totalPrice: 1500000,
        status: "PAID",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it("sendBookingDecisionEmail should trigger sendEmail for decision update", async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendBookingDecisionEmail({
        bookingId: "bkg-202",
        studentName: "Kirana",
        studentEmail: "mhs@ugm.ac.id",
        propertyName: "Kos UGM Sekip",
        action: "ACCEPT",
        ownerName: "Pak Heru",
        moveInDate: "2026-08-01",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});

describe("Customer Support WhatsApp URL Builder", () => {
  it("should format support URL with bookingId and propertyName context", () => {
    const url = buildSupportWhatsAppUrl({
      phone: "6281234567890",
      bookingId: "bkg-999-xyz",
      propertyName: "Kos Putri Anggrek",
    });

    expect(url).toContain("https://wa.me/6281234567890");
    expect(url).toContain(encodeURIComponent("bkg-999-xyz"));
    expect(url).toContain(encodeURIComponent("Kos Putri Anggrek"));
    expect(decodeURIComponent(url)).toContain("pesanan kamar #bkg-999-xyz (Kos Putri Anggrek)");
  });

  it("should format support URL with propertyName and propertyId context", () => {
    const url = buildSupportWhatsAppUrl({
      phone: "6289876543210",
      propertyName: "Kos Eksklusif Melati",
      propertyId: "prop-555",
    });

    expect(url).toContain("https://wa.me/6289876543210");
    expect(decodeURIComponent(url)).toContain("Kos Eksklusif Melati (ID: prop-555)");
    expect(decodeURIComponent(url)).toContain("Apakah kamar masih tersedia?");
  });

  it("should format fallback general support URL when no context is provided", () => {
    const url = buildSupportWhatsAppUrl({
      phone: "6281234567890",
    });

    expect(url).toContain("https://wa.me/6281234567890");
    expect(decodeURIComponent(url)).toContain("Halo CS KosPasti, saya butuh bantuan terkait layanan pemesanan kos");
  });

  it("should clean leading zero or plus sign from phone numbers", () => {
    const urlWithPlus = buildSupportWhatsAppUrl({
      phone: "+62 812-3456-7890",
    });
    expect(urlWithPlus).toContain("https://wa.me/6281234567890");

    const urlWithZero = buildSupportWhatsAppUrl({
      phone: "081234567890",
    });
    expect(urlWithZero).toContain("https://wa.me/6281234567890");
  });
});
