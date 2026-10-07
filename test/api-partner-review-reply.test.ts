import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH as partnerReplyPATCH, DELETE as partnerReplyDELETE } from "../src/app/api/partner/reviews/[id]/route";
import { PATCH as ownerReplyPATCH } from "../src/app/api/owner/reviews/[id]/route";
import { prisma } from "../src/lib/prisma";
import { signOwnerToken } from "../src/lib/auth";
import { NextRequest } from "next/server";

// Mock next/headers cookies
const mockCookiesStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = mockCookiesStore.get(key);
      return val ? { name: key, value: val } : undefined;
    },
    set: (obj: { name: string; value: string }) => {
      mockCookiesStore.set(obj.name, obj.value);
    },
  })),
}));

describe("Partner Review Reply API (Issue #225)", () => {
  const currentOwnerId = "owner-test-123";
  const otherOwnerId = "owner-other-456";
  const reviewId = "rev-test-1";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
  });

  async function setupPartnerToken(ownerId = currentOwnerId) {
    const token = await signOwnerToken({
      ownerId,
      name: "Owner Test",
      whatsapp_number: "6281234567890",
    });
    mockCookiesStore.set("partner_token", token);
    return token;
  }

  it("mengembalikan 401 Unauthorized jika tidak ada partner_token", async () => {
    const req = new NextRequest("http://localhost:3000/api/partner/reviews/rev-1", {
      method: "PATCH",
      body: JSON.stringify({ reply: "Terima kasih atas ulasannya!" }),
    });

    const res = await partnerReplyPATCH(req, {
      params: Promise.resolve({ id: "rev-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("mengembalikan 400 Bad Request jika teks balasan kosong", async () => {
    await setupPartnerToken();

    const req = new NextRequest("http://localhost:3000/api/partner/reviews/rev-1", {
      method: "PATCH",
      body: JSON.stringify({ reply: "   " }),
    });

    const res = await partnerReplyPATCH(req, {
      params: Promise.resolve({ id: "rev-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak boleh kosong");
  });

  it("mengembalikan 404 Not Found jika ulasan tidak ditemukan", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.review, "findUnique").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/partner/reviews/not-found-id", {
      method: "PATCH",
      body: JSON.stringify({ reply: "Terima kasih!" }),
    });

    const res = await partnerReplyPATCH(req, {
      params: Promise.resolve({ id: "not-found-id" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Ulasan tidak ditemukan");
  });

  it("mengembalikan 403 Forbidden jika mencoba membalas ulasan kos milik orang lain", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      id: reviewId,
      property: {
        id: "prop-other",
        owner_id: otherOwnerId,
      },
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/partner/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ reply: "Mencoba membalas ulasan orang lain" }),
    });

    const res = await partnerReplyPATCH(req, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain("tidak memiliki akses");
  });

  it("sukses membalas ulasan kos milik sendiri", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      id: reviewId,
      property: {
        id: "prop-1",
        owner_id: currentOwnerId,
      },
    } as any);

    const updatedMock = {
      id: reviewId,
      rating: 5,
      comment: "Bagus!",
      reply: "Terima kasih banyak atas feedback positifnya!",
      replied_at: new Date(),
      user: { id: "user-1", name: "Budi", avatar: null, email: "budi@test.com" },
      property: { id: "prop-1", name: "Kos Melati", image_url: null, address: "Jl. Mawar" },
      booking: null,
    };

    const updateSpy = vi.spyOn(prisma.review, "update").mockResolvedValue(updatedMock as any);

    const replyText = "Terima kasih banyak atas feedback positifnya!";
    const req = new NextRequest(`http://localhost:3000/api/partner/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ reply: replyText }),
    });

    const res = await partnerReplyPATCH(req, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.review.reply).toBe(replyText);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: reviewId },
        data: expect.objectContaining({
          reply: replyText,
        }),
      })
    );
  });

  it("sukses menghapus balasan ulasan dengan method DELETE", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      id: reviewId,
      property: {
        id: "prop-1",
        owner_id: currentOwnerId,
      },
    } as any);

    const updateSpy = vi.spyOn(prisma.review, "update").mockResolvedValue({
      id: reviewId,
      reply: null,
      replied_at: null,
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/partner/reviews/${reviewId}`, {
      method: "DELETE",
    });

    const res = await partnerReplyDELETE(req, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: reviewId },
        data: {
          reply: null,
          replied_at: null,
        },
      })
    );
  });

  it("alias /api/owner/reviews/[id] berfungsi sama persis", async () => {
    await setupPartnerToken();

    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      id: reviewId,
      property: {
        id: "prop-1",
        owner_id: currentOwnerId,
      },
    } as any);

    vi.spyOn(prisma.review, "update").mockResolvedValue({
      id: reviewId,
      reply: "Sip",
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/owner/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ reply: "Sip" }),
    });

    const res = await ownerReplyPATCH(req, {
      params: Promise.resolve({ id: reviewId }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
