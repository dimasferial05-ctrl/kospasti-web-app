import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatWhatsAppNumber,
  checkFonnteDeviceStatus,
  sendWhatsAppMessage,
  clearDeviceStatusCache,
} from "../src/lib/whatsapp";

describe("WhatsApp Notification Utility (Fonnte)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearDeviceStatusCache();
    process.env = { ...originalEnv };
    delete process.env.FONNTE_TOKEN;
    delete process.env.WHATSAPP_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
    clearDeviceStatusCache();
  });

  describe("formatWhatsAppNumber", () => {
    it("memformat nomor HP lokal (08...) ke format internasional (62...)", () => {
      expect(formatWhatsAppNumber("081234567890")).toBe("6281234567890");
    });

    it("memformat nomor HP tanpa 0 (8...) ke format internasional (62...)", () => {
      expect(formatWhatsAppNumber("81234567890")).toBe("6281234567890");
    });

    it("membersihkan karakter non-numerik seperti spasi dan tanda hubung", () => {
      expect(formatWhatsAppNumber("+62 812-3456-7890")).toBe("6281234567890");
    });

    it("mengembalikan string kosong jika input kosong", () => {
      expect(formatWhatsAppNumber("")).toBe("");
    });
  });

  describe("checkFonnteDeviceStatus", () => {
    it("mengembalikan true jika device status 'connect'", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ device_status: "connect", status: true }),
      } as Response);

      const status = await checkFonnteDeviceStatus("test-token");
      expect(status).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("https://api.fonnte.com/device", {
        method: "POST",
        headers: {
          Authorization: "test-token",
        },
      });
    });

    it("mengembalikan false jika device status 'disconnect'", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ device_status: "disconnect", status: false }),
      } as Response);

      const status = await checkFonnteDeviceStatus("test-token");
      expect(status).toBe(false);
    });

    it("mengembalikan false jika request fetch mengalami exception atau error jaringan", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const status = await checkFonnteDeviceStatus("test-token");
      expect(status).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("memanfaatkan in-memory cache sehingga pemanggilan berulang tidak melakukan fetch HTTP ekstra", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ device_status: "connect", status: true }),
      } as Response);

      const status1 = await checkFonnteDeviceStatus("test-token-cached");
      const status2 = await checkFonnteDeviceStatus("test-token-cached");
      const status3 = await checkFonnteDeviceStatus("test-token-cached");

      expect(status1).toBe(true);
      expect(status2).toBe(true);
      expect(status3).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("melakukan fetch ulang jika opsi forceRefresh bernilai true", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ device_status: "connect", status: true }),
      } as Response);

      await checkFonnteDeviceStatus("test-token-force");
      await checkFonnteDeviceStatus("test-token-force", { forceRefresh: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendWhatsAppMessage", () => {
    it("mengembalikan error jika nomor tujuan tidak valid", async () => {
      const result = await sendWhatsAppMessage({
        to: "",
        message: "Hello world",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nomor WhatsApp tujuan tidak valid");
    });

    it("menjalankan simulasi (simulated: true) jika token tidak diset", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendWhatsAppMessage({
        to: "081234567890",
        message: "Pesan tes simulasi",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("membatalkan pengiriman jika device Fonnte dalam status disconnected", async () => {
      process.env.FONNTE_TOKEN = "valid-token";

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ device_status: "disconnect", status: false }),
      } as Response);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await sendWhatsAppMessage({
        to: "081234567890",
        message: "Pesan pengingat",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Device WhatsApp tidak terhubung");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WHATSAPP ABORTED]")
      );
      // Memastikan hanya fetch ke /device yang dipanggil, tidak ada fetch ke /send
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://api.fonnte.com/device", expect.anything());
    });

    it("berhasil mengirim pesan jika device terhubung (connected)", async () => {
      process.env.FONNTE_TOKEN = "valid-token";

      // Mock 1: /device -> connect
      // Mock 2: /send -> success
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ device_status: "connect", status: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: true, id: "msg-123" }),
        } as Response);

      const result = await sendWhatsAppMessage({
        to: "081234567890",
        message: "Pesan penting",
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "https://api.fonnte.com/device", expect.anything());
      expect(global.fetch).toHaveBeenNthCalledWith(2, "https://api.fonnte.com/send", expect.anything());
    });

    it("tidak memanggil /device sama sekali jika opsi skipDeviceCheck bernilai true", async () => {
      process.env.FONNTE_TOKEN = "valid-token";

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: true, id: "msg-skip" }),
      } as Response);

      const result = await sendWhatsAppMessage({
        to: "081234567890",
        message: "Pesan tanpa pre-check",
        skipDeviceCheck: true,
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://api.fonnte.com/send", expect.anything());
    });

    it("memanfaatkan cache status device saat mengirim banyak pesan secara berurutan (batch)", async () => {
      process.env.FONNTE_TOKEN = "valid-token";

      // 1x device check, lalu 3x send
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ device_status: "connect", status: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: true, id: "msg-1" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: true, id: "msg-2" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: true, id: "msg-3" }),
        } as Response);

      const res1 = await sendWhatsAppMessage({ to: "081234567891", message: "Batch 1" });
      const res2 = await sendWhatsAppMessage({ to: "081234567892", message: "Batch 2" });
      const res3 = await sendWhatsAppMessage({ to: "081234567893", message: "Batch 3" });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);

      // Total 4 fetch (1x device + 3x send), bukan 6 fetch!
      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(global.fetch).toHaveBeenNthCalledWith(1, "https://api.fonnte.com/device", expect.anything());
      expect(global.fetch).toHaveBeenNthCalledWith(2, "https://api.fonnte.com/send", expect.anything());
      expect(global.fetch).toHaveBeenNthCalledWith(3, "https://api.fonnte.com/send", expect.anything());
      expect(global.fetch).toHaveBeenNthCalledWith(4, "https://api.fonnte.com/send", expect.anything());
    });
  });
});
