import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/magic-link/booking/decision/route";
import { prisma } from "@/lib/prisma";
import * as whatsappLib from "@/lib/whatsapp";

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    magicLink: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    booking: {
      update: vi.fn(),
    },
    property: {
      update: vi.fn(),
    },
    roomType: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Magic Link Decision Race Condition & Phantom Room Protection", () => {
  const mockToken = "valid-decision-token-123";
  const mockPropertyId = "prop-123";
  const mockRoomTypeId = "room-123";
  const mockBookingId = "book-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. mencegah penambahan kuota kamar ganda saat terjadi klik tolak bersamaan (race condition)", async () => {
    // Mock magic link valid
    vi.mocked(prisma.magicLink.findUnique).mockResolvedValue({
      id: "ml-123",
      token: mockToken,
      is_used: false,
      expires_at: new Date(Date.now() + 60000),
      owner: { name: "Pak Kos" },
      booking: {
        id: mockBookingId,
        student_name: "Mahasiswa",
        student_whatsapp: "081234567890",
        move_in_date: new Date(),
        property: { id: mockPropertyId, name: "Kos Aman", address: "Subang" },
        room_type: { id: mockRoomTypeId, name: "Deluxe" },
      },
    } as unknown as Awaited<ReturnType<typeof prisma.magicLink.findUnique>>);

    // Simulasi race condition: pemanggilan updateMany pertama berhasil (count: 1), kedua gagal (count: 0)
    let isFirstCall = true;
    const propertyUpdateSpy = vi.fn();
    const roomTypeUpdateSpy = vi.fn();

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        magicLink: {
          updateMany: vi.fn().mockImplementation(async () => {
            if (isFirstCall) {
              isFirstCall = false;
              return { count: 1 };
            }
            return { count: 0 };
          }),
        },
        booking: { update: vi.fn() },
        property: { update: propertyUpdateSpy },
        roomType: { update: roomTypeUpdateSpy },
      };
      return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
    });

    const createReq = () =>
      new Request("http://localhost:3000/api/magic-link/booking/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: mockToken,
          action: "REJECT",
          reason: "Kamar sudah penuh",
        }),
      });

    // Jalankan 2 request secara paralel
    const [res1, res2] = await Promise.all([POST(createReq()), POST(createReq())]);

    // Request pertama berhasil (200)
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.success).toBe(true);

    // Request kedua gagal (410) karena tautan sudah terpakai
    expect(res2.status).toBe(410);
    const json2 = await res2.json();
    expect(json2.success).toBe(false);

    // Kuota kamar hanya di-increment tepat 1 kali
    expect(propertyUpdateSpy).toHaveBeenCalledTimes(1);
    expect(propertyUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockPropertyId },
        data: { available_rooms: { increment: 1 } },
      })
    );

    expect(roomTypeUpdateSpy).toHaveBeenCalledTimes(1);
    expect(roomTypeUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockRoomTypeId },
        data: { available_rooms: { increment: 1 } },
      })
    );

    // WhatsApp mahasiswa hanya dikirim 1 kali
    expect(whatsappLib.sendWhatsAppMessage).toHaveBeenCalledTimes(1);
  });

  it("2. memproses penerimaan pesanan (ACCEPT) secara atomik", async () => {
    vi.mocked(prisma.magicLink.findUnique).mockResolvedValue({
      id: "ml-456",
      token: "accept-token",
      is_used: false,
      expires_at: new Date(Date.now() + 60000),
      owner: { name: "Pak Kos" },
      booking: {
        id: mockBookingId,
        student_name: "Mahasiswa",
        student_whatsapp: "081234567890",
        move_in_date: new Date(),
        property: { id: mockPropertyId, name: "Kos Aman", address: "Subang" },
        room_type: { id: mockRoomTypeId, name: "Deluxe" },
      },
    } as unknown as Awaited<ReturnType<typeof prisma.magicLink.findUnique>>);

    const bookingUpdateSpy = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        magicLink: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        booking: { update: bookingUpdateSpy },
        property: { update: vi.fn() },
        roomType: { update: vi.fn() },
      };
      return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
    });

    const req = new Request("http://localhost:3000/api/magic-link/booking/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "accept-token",
        action: "ACCEPT",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe("ACCEPTED");

    expect(bookingUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockBookingId },
        data: { status: "ACCEPTED" },
      })
    );
  });
});
