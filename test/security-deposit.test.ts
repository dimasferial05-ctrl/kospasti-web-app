import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getBookingDetail } from "@/app/api/bookings/[id]/route";
import { POST as renewBooking } from "@/app/api/bookings/[id]/renew/route";
import { POST as partnerCheckout } from "@/app/api/partner/bookings/[id]/checkout/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";
import * as notifLib from "@/lib/notifications";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Sistem Deposit Jaminan Kerusakan & Escrow Pelepasan (Issue #426)", () => {
  const mockTenantId = "tenant-dimas-426";
  const mockOwnerId = "owner-siti-426";
  const mockBookingId = "booking-deposit-426";

  const baseBooking = {
    id: mockBookingId,
    student_name: "Dimas Ferial",
    student_whatsapp: "081234567890",
    move_in_date: new Date("2026-11-01"),
    status: "COMPLETED",
    amount: 1000000,
    service_fee: 5000,
    security_deposit: 300000,
    deposit_status: "HELD",
    deposit_refunded_at: null,
    deposit_claimed_amount: 0,
    deposit_claim_reason: null,
    checkin_confirmed_at: new Date("2026-11-01T08:00:00Z"),
    checkout_confirmed_at: null,
    created_at: new Date("2026-11-01T07:00:00Z"),
    paid_at: new Date("2026-11-01T07:15:00Z"),
    payment_method: "QRIS",
    user_id: mockTenantId,
    property_id: "prop-426",
    room_type_id: "room-type-426",
    property: {
      id: "prop-426",
      name: "Kos Graha Mulia",
      address: "Jl. Kaliurang KM 5",
      price_per_month: 1000000,
      image_url: "/uploads/image.jpg",
      gender_type: "PUTRA",
      rules: "Dilarang merokok.",
      rental_terms: "Deposit Rp300.000.",
      owner_id: mockOwnerId,
      owner: {
        id: mockOwnerId,
        name: "Ibu Siti",
        whatsapp_number: "081987654321",
        email: "pemilik@kospasti.com",
      },
    },
    room_type: {
      id: "room-type-426",
      name: "Tipe A (AC)",
      price_per_month: 1000000,
      security_deposit: 300000,
      image_url: "/uploads/room.jpg",
    },
    user: {
      email: "dimas@kospasti.com",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Rincian Biaya & Pricing Booking Detail", () => {
    it("menghitung totalPrice termasuk rentPrice, adminFee, dan securityDeposit", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "user_token") return { value: "valid-user-token" };
          return undefined;
        }),
      });

      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: mockTenantId,
        email: "dimas@kospasti.com",
        role: "USER",
      } as any);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(baseBooking as any);
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(null);

      const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}`, {
        method: "GET",
      });

      const res = await getBookingDetail(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.securityDeposit).toBe(300000);
      expect(json.data.depositStatus).toBe("HELD");
      expect(json.data.pricing.rentPrice).toBe(1000000);
      expect(json.data.pricing.adminFee).toBe(5000);
      expect(json.data.pricing.securityDeposit).toBe(300000);
      expect(json.data.pricing.totalPrice).toBe(1305000); // 1.000.000 + 5.000 + 300.000
    });
  });

  describe("2. Proteksi Bebas Deposit Ganda pada Perpanjangan Sewa (Renewal)", () => {
    it("menetapkan security_deposit = 0 dan deposit_status = NONE pada pesanan renewal", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "user_token") return { value: "valid-user-token" };
          return undefined;
        }),
      });

      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: mockTenantId,
        email: "dimas@kospasti.com",
        role: "USER",
      } as any);

      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(baseBooking as any);
      vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(null);

      let createdData: any = null;
      vi.spyOn(prisma.booking, "create").mockImplementation(async (args: any) => {
        createdData = args.data;
        return {
          id: "booking-renewed-426",
          ...args.data,
          property: { name: "Kos Graha Mulia" },
          room_type: { name: "Tipe A (AC)" },
        } as any;
      });

      vi.spyOn(notifLib, "createInAppNotification").mockResolvedValue({} as any);

      const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
        method: "POST",
      });

      const res = await renewBooking(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(createdData).not.toBeNull();
      expect(createdData.security_deposit).toBe(0);
      expect(createdData.deposit_status).toBe("NONE");
    });
  });

  describe("3. Checkout & Pelepasan Deposit Mitra", () => {
    beforeEach(() => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "partner_token") return { value: "valid-partner-token" };
          return undefined;
        }),
      });

      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: mockOwnerId,
        role: "OWNER",
      } as any);

      vi.spyOn(notifLib, "notifyDepositReleased").mockResolvedValue();
    });

    it("mengembalikan 100% deposit saat kondisi kamar dinyatakan baik (GOOD)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(baseBooking as any);

      let updatedData: any = null;
      let roomTypeIncremented = false;
      let propertyIncremented = false;

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          booking: {
            update: vi.fn().mockImplementation((args: any) => {
              updatedData = args.data;
              return { ...baseBooking, ...args.data };
            }),
          },
          roomType: {
            update: vi.fn().mockImplementation(() => {
              roomTypeIncremented = true;
              return {};
            }),
          },
          property: {
            update: vi.fn().mockImplementation(() => {
              propertyIncremented = true;
              return {};
            }),
          },
        };
        return await callback(fakeTx);
      });

      const req = new Request(`http://localhost:3000/api/partner/bookings/${mockBookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "GOOD",
        }),
      });

      const res = await partnerCheckout(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.depositStatus).toBe("REFUNDED");
      expect(json.data.refundedAmount).toBe(300000);
      expect(json.data.claimedAmount).toBe(0);
      expect(updatedData.deposit_status).toBe("REFUNDED");
      expect(updatedData.deposit_claimed_amount).toBe(0);
      expect(roomTypeIncremented).toBe(true);
      expect(propertyIncremented).toBe(true);
      expect(notifLib.notifyDepositReleased).toHaveBeenCalledWith(
        expect.objectContaining({
          depositAmount: 300000,
          refundedAmount: 300000,
          claimedAmount: 0,
        })
      );
    });

    it("memproses klaim kerusakan dengan benar saat condition = DAMAGED", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(baseBooking as any);

      let updatedData: any = null;
      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback: any) => {
        const fakeTx = {
          booking: {
            update: vi.fn().mockImplementation((args: any) => {
              updatedData = args.data;
              return { ...baseBooking, ...args.data };
            }),
          },
          roomType: { update: vi.fn().mockResolvedValue({}) },
          property: { update: vi.fn().mockResolvedValue({}) },
        };
        return await callback(fakeTx);
      });

      const req = new Request(`http://localhost:3000/api/partner/bookings/${mockBookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "DAMAGED",
          claimAmount: 100000,
          claimReason: "Kunci kamar hilang dan remote AC pecah",
        }),
      });

      const res = await partnerCheckout(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.depositStatus).toBe("CLAIMED");
      expect(json.data.claimedAmount).toBe(100000);
      expect(json.data.refundedAmount).toBe(200000); // 300.000 - 100.000
      expect(updatedData.deposit_claimed_amount).toBe(100000);
      expect(updatedData.deposit_claim_reason).toBe("Kunci kamar hilang dan remote AC pecah");
      expect(notifLib.notifyDepositReleased).toHaveBeenCalledWith(
        expect.objectContaining({
          depositAmount: 300000,
          refundedAmount: 200000,
          claimedAmount: 100000,
          claimReason: "Kunci kamar hilang dan remote AC pecah",
        })
      );
    });

    it("menolak klaim kerusakan yang melebihi batas nominal deposit jaminan", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(baseBooking as any);

      const req = new Request(`http://localhost:3000/api/partner/bookings/${mockBookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "DAMAGED",
          claimAmount: 500000, // Deposit hanya 300.000
          claimReason: "Kerusakan tembok parah",
        }),
      });

      const res = await partnerCheckout(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain("tidak boleh melebihi");
    });

    it("menolak checkout jika kamar sudah pernah dicheckout sebelumnya (Anti-Double Checkout)", async () => {
      vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
        ...baseBooking,
        checkout_confirmed_at: new Date("2026-11-10T12:00:00Z"),
      } as any);

      const req = new Request(`http://localhost:3000/api/partner/bookings/${mockBookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "GOOD",
        }),
      });

      const res = await partnerCheckout(req, {
        params: Promise.resolve({ id: mockBookingId }),
      });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain("sudah dikonfirmasi checkout sebelumnya");
    });
  });
});
