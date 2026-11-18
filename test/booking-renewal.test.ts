import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/bookings/[id]/renew/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

describe("Booking Auto-Renewal Feature (Issue #424)", () => {
  const mockUserId = "user-dimas-123";
  const mockOtherUserId = "user-stranger-999";
  const mockBookingId = "booking-active-100";

  const mockExistingBooking = {
    id: mockBookingId,
    student_name: "Dimas Ferial",
    student_whatsapp: "081234567890",
    move_in_date: new Date("2026-11-01"),
    status: "PAID",
    amount: 1200000,
    service_fee: 5000,
    property_id: "prop-1",
    room_type_id: "rt-1",
    user_id: mockUserId,
    property: {
      id: "prop-1",
      name: "Kos Graha Pasti",
      price_per_month: 1200000,
      owner_id: "owner-1",
    },
    room_type: {
      id: "rt-1",
      name: "Kamar Deluxe AC",
      price_per_month: 1200000,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock: unauthenticated
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
  });

  const setupAuth = (userId: string = mockUserId) => {
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => {
        if (name === "user_token") return { value: "valid-user-token" };
        return undefined;
      }),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: userId,
      email: "dimas@example.com",
      role: "USER",
    } as any);
  };

  it("1. Menolak request (401) jika pengguna belum login", async () => {
    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Unauthorized");
  });

  it("2. Menolak request (404) jika ID pesanan tidak ditemukan", async () => {
    setupAuth();
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/bookings/non-existent/renew", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "non-existent" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak ditemukan");
  });

  it("3. Menolak request (403) jika pesanan bukan milik pengguna yang sedang login (Anti-IDOR)", async () => {
    setupAuth(mockOtherUserId);
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockExistingBooking as any);

    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Akses ditolak");
  });

  it("4. Menolak request (400) jika status booking tidak eligible untuk perpanjangan (misal: CANCELLED)", async () => {
    setupAuth();
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
      ...mockExistingBooking,
      status: "CANCELLED",
    } as any);

    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak dapat diperpanjang");
  });

  it("5. Menolak request (400) jika pengguna sudah memiliki perpanjangan sewa berstatus PENDING", async () => {
    setupAuth();
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockExistingBooking as any);
    vi.spyOn(prisma.booking, "findFirst").mockResolvedValue({
      id: "pending-renewal-999",
      status: "PENDING",
    } as any);

    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("masih berstatus PENDING");
    expect(data.hasPendingRenewal).toBe(true);
    expect(data.checkoutUrl).toBe("/checkout/pending-renewal-999");
  });

  it("6. Berhasil membuat booking perpanjangan baru berstatus PENDING dan menjaga ketersediaan kamar fisik", async () => {
    setupAuth();
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockExistingBooking as any);
    vi.spyOn(prisma.booking, "findFirst").mockResolvedValue(null);

    const createdBookingMock = {
      id: "booking-renewed-200",
      property_id: "prop-1",
      room_type_id: "rt-1",
      student_name: "Dimas Ferial",
      student_whatsapp: "081234567890",
      move_in_date: new Date("2026-12-01"),
      status: "PENDING",
      amount: 1200000,
      user_id: mockUserId,
      property: { name: "Kos Graha Pasti" },
      room_type: { name: "Kamar Deluxe AC" },
    };

    const createSpy = vi.spyOn(prisma.booking, "create").mockResolvedValue(createdBookingMock as any);
    const propertyUpdateSpy = vi.spyOn(prisma.property, "update");

    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}/renew`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: mockBookingId }) });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe("booking-renewed-200");
    expect(data.data.checkoutUrl).toBe("/checkout/booking-renewed-200");
    expect(createSpy).toHaveBeenCalledTimes(1);

    // Verifikasi bahwa available_rooms TIDAK dipotong lagi karena kamar sudah dihuni
    expect(propertyUpdateSpy).not.toHaveBeenCalled();
  });
});
