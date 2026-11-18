import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/bookings/[id]/route";
import { prisma } from "@/lib/prisma";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Digital Contract & Lease Agreement Data (Issue #424)", () => {
  const mockTenantId = "tenant-dimas-123";
  const mockBookingId = "booking-contract-test";

  const mockBookingData = {
    id: mockBookingId,
    student_name: "Dimas Ferial",
    student_whatsapp: "081234567890",
    move_in_date: new Date("2026-11-01"),
    status: "PAID",
    amount: 1200000,
    service_fee: 5000,
    created_at: new Date("2026-11-01T10:00:00Z"),
    paid_at: new Date("2026-11-01T10:05:00Z"),
    payment_method: "QRIS",
    payment_gateway_ref: "REF-123456",
    snap_token: "snap-token-mock",
    user_id: mockTenantId,
    property: {
      id: "prop-1",
      name: "Kos Graha Mulia",
      address: "Jl. Kaliurang KM 5",
      price_per_month: 1200000,
      image_url: "/uploads/image.jpg",
      gender_type: "PUTRA",
      rules: "Dilarang merokok di dalam kamar dan menjaga ketertiban setelah pukul 22.00.",
      rental_terms: "Sewa dibayar bulanan dimuka. Pembatalan sepihak tunduk pada kebijakan refund.",
      owner_id: "owner-1",
      owner: {
        name: "Ibu Hj. Siti",
        whatsapp_number: "081987654321",
        email: "pemilik@kospasti.com",
      },
    },
    room_type: {
      id: "rt-1",
      name: "Tipe A (AC & Kamar Mandi Dalam)",
      price_per_month: 1200000,
      image_url: "/uploads/room.jpg",
    },
    user: {
      email: "dimas@kospasti.com",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => {
        if (name === "user_token") return { value: "valid-token" };
        return undefined;
      }),
    });

    vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
      userId: mockTenantId,
      email: "dimas@kospasti.com",
      role: "USER",
    } as any);
  });

  it("1. Mengembalikan data lengkap kontrak digital termasuk rules, rental_terms, dan email pemilik", async () => {
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(mockBookingData as any);

    const req = new Request(`http://localhost:3000/api/bookings/${mockBookingId}`, {
      method: "GET",
    });

    const res = await GET(req, { params: Promise.resolve({ id: mockBookingId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    const data = json.data;
    expect(data.id).toBe(mockBookingId);
    expect(data.studentName).toBe("Dimas Ferial");
    expect(data.property.name).toBe("Kos Graha Mulia");
    expect(data.property.rules).toBe("Dilarang merokok di dalam kamar dan menjaga ketertiban setelah pukul 22.00.");
    expect(data.property.rental_terms).toBe("Sewa dibayar bulanan dimuka. Pembatalan sepihak tunduk pada kebijakan refund.");
    expect(data.property.owner.name).toBe("Ibu Hj. Siti");
    expect(data.property.owner.email).toBe("pemilik@kospasti.com");
  });
});
