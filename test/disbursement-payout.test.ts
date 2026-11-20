import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeBankCode, createDisbursement, isIrisSimulation } from "@/lib/disbursement";
import { POST } from "@/app/api/admin/payouts/[id]/process/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as adminAuth from "@/lib/admin-auth";
import * as notifications from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg();
    }),
    payout: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      update: vi.fn().mockResolvedValue({ id: "book-1" }),
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  notifyPayoutProcessed: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Disbursement Service - normalizeBankCode", () => {
  it("normalizes common Indonesian banks correctly", () => {
    expect(normalizeBankCode("Bank Central Asia")).toBe("bca");
    expect(normalizeBankCode("BCA")).toBe("bca");
    expect(normalizeBankCode("BCA Digital (blu)")).toBe("bca");
    expect(normalizeBankCode("Bank Mandiri")).toBe("mandiri");
    expect(normalizeBankCode("Livin by Mandiri")).toBe("mandiri");
    expect(normalizeBankCode("Bank Negara Indonesia (BNI)")).toBe("bni");
    expect(normalizeBankCode("Bank Rakyat Indonesia (BRI)")).toBe("bri");
    expect(normalizeBankCode("BRImo")).toBe("bri");
    expect(normalizeBankCode("Bank Syariah Indonesia")).toBe("bsi");
    expect(normalizeBankCode("BSI")).toBe("bsi");
    expect(normalizeBankCode("CIMB Niaga")).toBe("cimb");
    expect(normalizeBankCode("Bank Permata")).toBe("permata");
    expect(normalizeBankCode("Bank Danamon")).toBe("danamon");
    expect(normalizeBankCode("Bank Jago")).toBe("jago");
    expect(normalizeBankCode("SeaBank")).toBe("seabank");
  });

  it("handles whitespace and casing gracefully", () => {
    expect(normalizeBankCode("   bCa  ")).toBe("bca");
    expect(normalizeBankCode("MANDIRI")).toBe("mandiri");
  });

  it("cleans non-alphanumeric characters for unknown banks with fallback", () => {
    expect(normalizeBankCode("Bank-Kaltim-Tara!")).toBe("bankkaltimtara");
    expect(normalizeBankCode("")).toBe("bca");
  });
});

describe("Disbursement Service - createDisbursement", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("returns error if required fields are missing", async () => {
    const res = await createDisbursement({
      payoutId: "",
      amount: 0,
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("failed");
    expect(res.error).toContain("Parameter pencairan tidak lengkap");
  });

  it("uses Smart Simulator when IRIS_SIMULATION=true or IRIS_API_KEY is empty", async () => {
    process.env.IRIS_SIMULATION = "true";
    delete process.env.IRIS_API_KEY;

    const res = await createDisbursement({
      payoutId: "payout-sim-12345",
      amount: 1500000,
      bankName: "BCA",
      accountNumber: "1234567890",
      accountHolder: "Budi Santoso",
      notes: "Test Payout",
    });

    expect(res.success).toBe(true);
    expect(res.isSimulated).toBe(true);
    expect(res.status).toBe("completed");
    expect(res.referenceNo).toMatch(/^REF-IRIS-/);
    expect(res.disbursementId).toMatch(/^IRIS-SIM-/);
  });

  it("calls Midtrans Iris API with correct headers & idempotency key in live mode", async () => {
    process.env.IRIS_SIMULATION = "false";
    process.env.IRIS_API_KEY = "iris_test_key_abc123";
    process.env.IRIS_IS_PRODUCTION = "false";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "queued",
        payouts: [
          {
            reference_no: "REF-LIVE-987654",
            status: "queued",
          },
        ],
      }),
    } as unknown as Response);

    const res = await createDisbursement({
      payoutId: "payout-live-999",
      amount: 2000000,
      bankName: "Mandiri",
      accountNumber: "1400012345678",
      accountHolder: "Siti Aminah",
      notes: "Sewa Kos November",
    });

    expect(fetchSpy).toHaveBeenCalled();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain("https://app.sandbox.midtrans.com/iris/api/v1/payouts");
    expect(options?.headers).toHaveProperty("X-Idempotency-Key", "payout-payout-live-999");
    expect(res.success).toBe(true);
    expect(res.referenceNo).toBe("REF-LIVE-987654");
    expect(res.isSimulated).toBe(false);

    fetchSpy.mockRestore();
  });

  it("handles Midtrans Iris API error response gracefully", async () => {
    process.env.IRIS_SIMULATION = "false";
    process.env.IRIS_API_KEY = "iris_test_key_abc123";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error_message: "Bank account not found or invalid" }),
    } as unknown as Response);

    const res = await createDisbursement({
      payoutId: "payout-fail-001",
      amount: 1000000,
      bankName: "BCA",
      accountNumber: "0000000000",
      accountHolder: "Anon",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe("failed");
    expect(res.error).toContain("Bank account not found or invalid");

    fetchSpy.mockRestore();
  });

  describe("Production Environment Security Guard (Fail-Closed)", () => {
    const testEnv = { ...originalEnv };

    beforeEach(() => {
      process.env = { ...testEnv };
    });

    afterEach(() => {
      process.env = { ...testEnv };
    });

    it("throws FATAL error if IRIS_API_KEY is missing in production for isIrisSimulation()", () => {
      process.env.NODE_ENV = "production";
      delete process.env.IRIS_API_KEY;
      delete process.env.IRIS_SIMULATION;

      expect(() => isIrisSimulation()).toThrowError(
        "FATAL: IRIS_API_KEY wajib dikonfigurasi pada mode produksi!"
      );
    });

    it("throws FATAL error if IRIS_SIMULATION is true in production for isIrisSimulation()", () => {
      process.env.NODE_ENV = "production";
      process.env.IRIS_SIMULATION = "true";
      process.env.IRIS_API_KEY = "iris_live_secret";

      expect(() => isIrisSimulation()).toThrowError(
        "FATAL: Mode simulasi IRIS_SIMULATION dilarang aktif pada mode produksi!"
      );
    });

    it("returns false if IRIS_API_KEY is present and IRIS_SIMULATION is not true in production", () => {
      process.env.NODE_ENV = "production";
      process.env.IRIS_API_KEY = "iris_live_secret";
      delete process.env.IRIS_SIMULATION;

      expect(isIrisSimulation()).toBe(false);
    });

    it("throws FATAL error in createDisbursement() if IRIS_API_KEY is missing in production", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.IRIS_API_KEY;
      delete process.env.IRIS_SIMULATION;

      await expect(
        createDisbursement({
          payoutId: "payout-prod-test",
          amount: 1000000,
          bankName: "BCA",
          accountNumber: "1234567890",
          accountHolder: "Budi Santoso",
        })
      ).rejects.toThrowError("FATAL: IRIS_API_KEY wajib dikonfigurasi pada mode produksi!");
    });

    it("throws FATAL error in createDisbursement() if IRIS_SIMULATION is true in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.IRIS_SIMULATION = "true";
      process.env.IRIS_API_KEY = "iris_live_secret";

      await expect(
        createDisbursement({
          payoutId: "payout-prod-test",
          amount: 1000000,
          bankName: "BCA",
          accountNumber: "1234567890",
          accountHolder: "Budi Santoso",
        })
      ).rejects.toThrowError("FATAL: Mode simulasi IRIS_SIMULATION dilarang aktif pada mode produksi!");
    });
  });
});

describe("Admin Payout Process API Route (POST /api/admin/payouts/[id]/process)", () => {
  const routeEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...routeEnv, NODE_ENV: "test", IRIS_SIMULATION: "true" };
  });

  afterEach(() => {
    process.env = { ...routeEnv };
  });

  it("returns 401 if admin is not authenticated", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(false);

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/p1/process", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 if payout record does not exist", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);
    (prisma.payout.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/not-found/process", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "not-found" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 if payout status is not PAYOUT_PENDING", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);
    (prisma.payout.findUnique as any).mockResolvedValue({
      id: "p-already-paid",
      status: "PAYOUT_PAID",
      amount: 1500000,
    });

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/p-already-paid/process", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p-already-paid" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Hanya payout berstatus PAYOUT_PENDING");
  });

  it("returns 400 if partner has no registered payout method", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);
    (prisma.payout.findUnique as any).mockResolvedValue({
      id: "p-no-method",
      status: "PAYOUT_PENDING",
      amount: 1500000,
      owner: { payout_method: null },
    });

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/p-no-method/process", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p-no-method" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Mitra belum mendaftarkan metode/rekening");
  });

  it("returns 400 if partner's payout method is not verified", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);
    (prisma.payout.findUnique as any).mockResolvedValue({
      id: "p-unverified",
      status: "PAYOUT_PENDING",
      amount: 1500000,
      owner: {
        payout_method: {
          bank_name: "BCA",
          account_number: "1234567890",
          account_holder: "Pak Mitra",
          is_verified: false,
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/p-unverified/process", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p-unverified" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Rekening mitra belum diverifikasi oleh admin");
  });

  it("successfully processes payout via gateway, saves reference number, and notifies partner", async () => {
    vi.spyOn(adminAuth, "isValidAdminRequest").mockReturnValue(true);
    (prisma.payout.findUnique as any).mockResolvedValue({
      id: "p-success",
      booking_id: "book-123456",
      status: "PAYOUT_PENDING",
      amount: 1500000,
      net_amount: 1455000,
      owner: {
        id: "owner-1",
        name: "Haji Ahmad",
        email: "ahmad@example.com",
        whatsapp_number: "08123456789",
        payout_method: {
          bank_name: "Bank BCA",
          account_number: "8881234567",
          accountHolder: "Haji Ahmad",
          account_holder: "Haji Ahmad",
          is_verified: true,
        },
      },
      booking: {
        id: "book-123456",
        property: { name: "Kos Berkah" },
      },
    });

    const updatedRecord = {
      id: "p-success",
      status: "PAYOUT_PAID",
      disbursement_reference_no: "REF-IRIS-TEST",
      disbursement_status: "completed",
    };
    (prisma.payout.update as any).mockResolvedValue(updatedRecord);

    const req = new NextRequest("http://localhost:3000/api/admin/payouts/p-success/process", {
      method: "POST",
      body: JSON.stringify({ notes: "Pencairan disetujui" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "p-success" }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.payout.disbursement_reference_no).toBeDefined();
    expect(json.data.disbursement.referenceNo).toBeDefined();

    // Verify prisma update was called with disbursement details
    expect(prisma.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p-success" },
        data: expect.objectContaining({
          status: "PAYOUT_PAID",
          disbursement_provider: "MIDTRANS_IRIS",
          disbursement_status: "completed",
        }),
      })
    );

    // Verify notification was sent
    expect(notifications.notifyPayoutProcessed).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerName: "Haji Ahmad",
        amount: 1455000,
        bankName: "Bank BCA",
      })
    );
  });
});
