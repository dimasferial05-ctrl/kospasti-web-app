import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as getPartnerPayouts } from "@/app/api/partner/payouts/route";
import { processReadyPayouts } from "@/lib/payout-processor";
import { PayoutInvoiceModal } from "@/components/partner/PayoutInvoiceModal";
import { cookies } from "next/headers";
import { verifyOwnerToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  verifyOwnerToken: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  notifyEscrowReleased: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payout: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("Partner Payout Transparency & Invoices - Issue #398", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Endpoint: GET /api/partner/payouts", () => {
    it("menolak akses jika partner belum login (401 Unauthorized)", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as never);

      const res = await getPartnerPayouts();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("menolak akses jika token mitra tidak valid (401 Unauthorized)", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "invalid-token" }),
      } as never);
      vi.mocked(verifyOwnerToken).mockResolvedValue(null as never);

      const res = await getPartnerPayouts();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("menormalisasi data payout legacy dengan kalkulasi komisi 3% dan net otomatis", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "valid-token" }),
      } as never);
      vi.mocked(verifyOwnerToken).mockResolvedValue({ ownerId: "owner-123" } as never);

      // Data legacy: gross_amount 0, platform_fee 0, net_amount 0, hanya ada amount sewa
      const mockLegacyPayouts = [
        {
          id: "pay-legacy-1",
          booking_id: "book-1",
          owner_id: "owner-123",
          amount: 2000000,
          gross_amount: 0,
          platform_fee: 0,
          net_amount: 0,
          status: "PAYOUT_PAID",
          created_at: new Date("2026-11-01T00:00:00Z"),
          booking: {
            id: "book-1",
            student_name: "Dimas",
            property: { id: "p-1", name: "Kos Graha Subang" },
          },
        },
      ];

      vi.mocked(prisma.payout.findMany).mockResolvedValue(mockLegacyPayouts as never);

      const res = await getPartnerPayouts();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);

      const item = data.data[0];
      // Gross fallback ke p.amount = 2.000.000
      expect(item.gross_amount).toBe(2000000);
      // Fee 3% dari 2.000.000 = 60.000
      expect(item.platform_fee).toBe(60000);
      // Net = 2.000.000 - 60.000 = 1.940.000
      expect(item.net_amount).toBe(1940000);
    });

    it("mempertahankan nilai rincian eksplisit jika sudah tersimpan di database", async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: "valid-token" }),
      } as never);
      vi.mocked(verifyOwnerToken).mockResolvedValue({ ownerId: "owner-123" } as never);

      const mockModernPayouts = [
        {
          id: "pay-modern-1",
          booking_id: "book-2",
          owner_id: "owner-123",
          amount: 1455000,
          gross_amount: 1500000,
          platform_fee: 45000,
          net_amount: 1455000,
          status: "PAYOUT_PAID",
          created_at: new Date("2026-11-10T00:00:00Z"),
          booking: {
            id: "book-2",
            student_name: "Siti Rahma",
            property: { id: "p-2", name: "Kos Mawar Indah" },
          },
        },
      ];

      vi.mocked(prisma.payout.findMany).mockResolvedValue(mockModernPayouts as never);

      const res = await getPartnerPayouts();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data[0].gross_amount).toBe(1500000);
      expect(data.data[0].platform_fee).toBe(45000);
      expect(data.data[0].net_amount).toBe(1455000);
    });
  });

  describe("Payout Processor: processReadyPayouts()", () => {
    it("membuat payout dengan perhitungan komisi platform 3% pada saat pelepasan escrow", async () => {
      const mockReadyBookings = [
        {
          id: "book-escrow-1",
          amount: 1000000,
          student_name: "Budi Santoso",
          property: {
            id: "p-1",
            name: "Kos Graha Asri",
            owner_id: "owner-999",
            price_per_month: 1000000,
            owner: {
              id: "owner-999",
              name: "Pak Haji",
              whatsapp_number: "08123456789",
            },
          },
          room_type: null,
        },
      ];

      vi.mocked(prisma.booking.findMany).mockResolvedValue(mockReadyBookings as never);

      const count = await processReadyPayouts();
      expect(count).toBe(1);

      expect(prisma.payout.create).toHaveBeenCalledWith({
        data: {
          booking_id: "book-escrow-1",
          owner_id: "owner-999",
          amount: 970000, // net amount (1.000.000 - 30.000)
          gross_amount: 1000000,
          platform_fee: 30000, // 3%
          net_amount: 970000,
          status: "PAYOUT_PENDING",
        },
      });
    });
  });

  describe("Komponen PayoutInvoiceModal", () => {
    const mockPayoutData = {
      id: "abc12345-6789-test",
      booking_id: "book-123",
      amount: 1940000,
      gross_amount: 2000000,
      platform_fee: 60000,
      net_amount: 1940000,
      status: "PAYOUT_PAID",
      payout_method_snapshot: JSON.stringify({
        bank_name: "BCA",
        account_number: "8830123456",
        account_holder: "Dimas Ferial",
      }),
      processed_at: "2026-11-15T10:00:00Z",
      processed_by: "Admin Finance",
      created_at: "2026-11-14T08:00:00Z",
      booking: {
        id: "book-123",
        student_name: "Ahmad Rizky",
        checkin_confirmed_at: "2026-11-14T08:00:00Z",
        property: {
          name: "Kos Graha Subang Asri",
        },
      },
    };

    it("tidak merender apa pun jika isOpen = false", () => {
      const html = renderToStaticMarkup(
        <PayoutInvoiceModal isOpen={false} onClose={() => {}} payout={mockPayoutData} />
      );
      expect(html).toBe("");
    });

    it("merender rincian nomor invoice, penyewa, properti, dan rekening tujuan", () => {
      const html = renderToStaticMarkup(
        <PayoutInvoiceModal isOpen={true} onClose={() => {}} payout={mockPayoutData} />
      );

      // Nomor invoice format INV-PAY-ABC12345
      expect(html).toContain("INV-PAY-ABC12345");
      expect(html).toContain("Kos Graha Subang Asri");
      expect(html).toContain("Ahmad Rizky");
      expect(html).toContain("BCA");
      expect(html).toContain("8830123456");
      expect(html).toContain("Dimas Ferial");
      expect(html).toContain("Sudah Ditransfer");
    });

    it("menampilkan kalkulasi transparan: Gross, Potongan Komisi 3%, dan Net Diterima", () => {
      const html = renderToStaticMarkup(
        <PayoutInvoiceModal isOpen={true} onClose={() => {}} payout={mockPayoutData} />
      );

      // Label rincian
      expect(html).toContain("Nilai Sewa Masuk (Gross)");
      expect(html).toContain("Potongan Komisi Platform KosPasti (3%)");
      expect(html).toContain("Dana Bersih Diterima (Net)");

      // Nilai rupiah (dalam format id-ID)
      expect(html).toContain("2.000.000");
      expect(html).toContain("60.000");
      expect(html).toContain("1.940.000");
    });

    it("mematuhi aturan Anti-Slop: Tidak ada emoji mentah dalam markup invoice", () => {
      const html = renderToStaticMarkup(
        <PayoutInvoiceModal isOpen={true} onClose={() => {}} payout={mockPayoutData} />
      );

      // Emoji slop check: tidak boleh ada raw emojis
      const forbiddenEmojis = ["💰", "⭐", "🌟", "✨", "🚀", "💸", "🤑", "🏦"];
      for (const emoji of forbiddenEmojis) {
        expect(html).not.toContain(emoji);
      }
    });
  });
});
