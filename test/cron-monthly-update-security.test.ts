import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/cron/monthly-update/route";
import { prisma } from "@/lib/prisma";
import * as whatsappLib from "@/lib/whatsapp";

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Monthly Update Cron Security & Authorization (Issue #269)", () => {
  const originalEnvCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnvCronSecret !== undefined) {
      process.env.CRON_SECRET = originalEnvCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  const createRequest = (method: "GET" | "POST", authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }
    return new Request("http://localhost:3000/api/cron/monthly-update", {
      method,
      headers,
    });
  };

  describe("Skenario 1: CRON_SECRET Belum Disetel di Environment (Fail-Closed)", () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it("GET: Menolak request (401) jika CRON_SECRET tidak ada di environment (tanpa header)", async () => {
      const findManySpy = vi.spyOn(prisma.owner, "findMany");
      const req = createRequest("GET");

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Invalid or missing CRON secret token");
      expect(findManySpy).not.toHaveBeenCalled();
    });

    it("POST: Menolak request (401) jika CRON_SECRET tidak ada di environment (meski mengirim header sembarang)", async () => {
      const findManySpy = vi.spyOn(prisma.owner, "findMany");
      const req = createRequest("POST", "Bearer random-token-123");

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Invalid or missing CRON secret token");
      expect(findManySpy).not.toHaveBeenCalled();
    });
  });

  describe("Skenario 2: CRON_SECRET Sudah Disetel, tetapi Token Kosong atau Tidak Cocok", () => {
    const validSecret = "super-secure-cron-secret-2026";

    beforeEach(() => {
      process.env.CRON_SECRET = validSecret;
    });

    it("Menolak 401 jika request tidak menyertakan header authorization", async () => {
      const findManySpy = vi.spyOn(prisma.owner, "findMany");
      const req = createRequest("GET");

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Invalid or missing CRON secret token");
      expect(findManySpy).not.toHaveBeenCalled();
    });

    it("Menolak 401 jika header authorization menyertakan token yang salah", async () => {
      const findManySpy = vi.spyOn(prisma.owner, "findMany");
      const req = createRequest("POST", "Bearer wrong-token-456");

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Invalid or missing CRON secret token");
      expect(findManySpy).not.toHaveBeenCalled();
    });

    it("Menolak 401 jika format header bukan Bearer", async () => {
      const findManySpy = vi.spyOn(prisma.owner, "findMany");
      const req = createRequest("GET", `Basic ${validSecret}`);

      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Invalid or missing CRON secret token");
      expect(findManySpy).not.toHaveBeenCalled();
    });
  });

  describe("Skenario 3: Autentikasi Berhasil dengan Token CRON yang Tepat", () => {
    const validSecret = "super-secure-cron-secret-2026";

    beforeEach(() => {
      process.env.CRON_SECRET = validSecret;
    });

    it("GET: Lolos autentikasi dan memproses routine ketika token valid (tidak ada owner)", async () => {
      vi.spyOn(prisma.owner, "findMany").mockResolvedValue([] as unknown as never);

      const req = createRequest("GET", `Bearer ${validSecret}`);
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Tidak ada pemilik kos");
      expect(data.sentCount).toBe(0);
    });

    it("POST: Lolos autentikasi dan memproses pengiriman WhatsApp pemilik kos", async () => {
      const mockOwner = {
        id: "owner-1",
        name: "Ibu Hajjah Siti",
        whatsapp_number: "08123456789",
        properties: [
          {
            id: "prop-1",
            name: "Kos Melati",
            available_rooms: 2,
          },
        ],
      };

      vi.spyOn(prisma.owner, "findMany").mockResolvedValue([mockOwner] as unknown as never);
      vi.spyOn(prisma.magicLink, "updateMany").mockResolvedValue({ count: 1 });
      vi.spyOn(prisma.magicLink, "create").mockResolvedValue({
        id: "ml-1",
        token: "token-abc-123",
        owner_id: "owner-1",
      } as unknown as never);

      const sendWhatsAppSpy = vi.spyOn(whatsappLib, "sendWhatsAppMessage");

      const req = createRequest("POST", `Bearer ${validSecret}`);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sentCount).toBe(1);
      expect(sendWhatsAppSpy).toHaveBeenCalledTimes(1);
      expect(sendWhatsAppSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "08123456789",
          message: expect.stringContaining("Ibu Hajjah Siti"),
        })
      );
    });
  });
});
