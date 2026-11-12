import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock Next.js router & cookies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

const mockCookies = new Map<string, { value: string }>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => mockCookies.get(key),
  })),
}));

// Mock Prisma
const mockNotificationCreate = vi.fn();
const mockNotificationCount = vi.fn();
const mockNotificationFindMany = vi.fn();
const mockNotificationUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: (...args: any[]) => mockNotificationCreate(...args),
      count: (...args: any[]) => mockNotificationCount(...args),
      findMany: (...args: any[]) => mockNotificationFindMany(...args),
      updateMany: (...args: any[]) => mockNotificationUpdateMany(...args),
    },
  },
}));

// Mock WhatsApp agar tidak mengirim HTTP eksternal
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn(async () => ({ ok: true })),
}));

import { formatRelativeTime } from "@/lib/date-utils";
import { createInAppNotification } from "@/lib/notifications";
import { signUserToken, signOwnerToken } from "@/lib/auth";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { PATCH as markRead } from "@/app/api/notifications/[id]/read/route";
import { POST as markAllRead } from "@/app/api/notifications/read-all/route";
import { NotificationBell } from "@/components/notifications/NotificationBell";

describe("In-App Notification Center - Issue #386", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.clear();
  });

  describe("Helper formatRelativeTime (date-utils)", () => {
    it("menampilkan waktu relatif Indonesia dengan akurat", () => {
      const ref = new Date("2026-11-12T10:00:00.000Z");

      expect(formatRelativeTime("2026-11-12T09:59:45.000Z", ref)).toBe("Baru saja");
      expect(formatRelativeTime("2026-11-12T09:50:00.000Z", ref)).toBe("10 menit lalu");
      expect(formatRelativeTime("2026-11-12T07:00:00.000Z", ref)).toBe("3 jam lalu");
      expect(formatRelativeTime("2026-11-11T09:00:00.000Z", ref)).toBe("Kemarin");
      expect(formatRelativeTime("2026-11-08T10:00:00.000Z", ref)).toBe("4 hari lalu");
    });
  });

  describe("Helper createInAppNotification", () => {
    it("menyimpan notifikasi untuk mahasiswa (userId) ke database", async () => {
      mockNotificationCreate.mockResolvedValueOnce({ id: "n-1" });

      await createInAppNotification({
        userId: "user-123",
        title: "Pesanan Disetujui",
        message: "Pesanan kos Anda telah disetujui pemilik.",
        type: "BOOKING_STATUS",
        link: "/receipt/b-1",
      });

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: {
          user_id: "user-123",
          owner_id: null,
          title: "Pesanan Disetujui",
          message: "Pesanan kos Anda telah disetujui pemilik.",
          type: "BOOKING_STATUS",
          link: "/receipt/b-1",
        },
      });
    });

    it("menyimpan notifikasi untuk mitra pemilik kos (ownerId)", async () => {
      mockNotificationCreate.mockResolvedValueOnce({ id: "n-2" });

      await createInAppNotification({
        ownerId: "owner-999",
        title: "Dana Dicairkan",
        message: "Payout Rp 1.000.000 sedang diproses.",
        type: "PAYOUT_UPDATE",
        link: "/partner/dashboard/payouts",
      });

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: {
          user_id: null,
          owner_id: "owner-999",
          title: "Dana Dicairkan",
          message: "Payout Rp 1.000.000 sedang diproses.",
          type: "PAYOUT_UPDATE",
          link: "/partner/dashboard/payouts",
        },
      });
    });

    it("mengembalikan null tanpa error jika userId dan ownerId keduanya kosong", async () => {
      const result = await createInAppNotification({
        title: "Test",
        message: "Tidak ada target",
        type: "SYSTEM",
      });
      expect(result).toBeNull();
      expect(mockNotificationCreate).not.toHaveBeenCalled();
    });
  });

  describe("API Endpoints (/api/notifications)", () => {
    it("mengembalikan 401 jika tidak ada cookie autentikasi", async () => {
      const req = new Request("http://localhost:3000/api/notifications");
      const res = await getNotifications(req as any);
      expect(res.status).toBe(401);
    });

    it("mengambil notifikasi untuk User yang terautentikasi", async () => {
      const token = await signUserToken({
        userId: "u-01",
        email: "dimas@student.id",
        name: "Dimas",
      });
      mockCookies.set("user_token", { value: token });

      mockNotificationCount.mockResolvedValueOnce(2);
      mockNotificationFindMany.mockResolvedValueOnce([
        {
          id: "notif-1",
          title: "Pembayaran Berhasil",
          message: "Pembayaran kos terverifikasi.",
          type: "PAYMENT_SUCCESS",
          link: "/receipt/1",
          is_read: false,
          read_at: null,
          created_at: new Date(),
        },
      ]);

      const req = new Request("http://localhost:3000/api/notifications?audience=USER");
      const res = await getNotifications(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.unread_count).toBe(2);
      expect(data.notifications).toHaveLength(1);
      expect(mockNotificationCount).toHaveBeenCalledWith({
        where: { user_id: "u-01", is_read: false },
      });
    });

    it("mengambil notifikasi untuk Owner Mitra jika audience=OWNER", async () => {
      const token = await signOwnerToken({
        ownerId: "own-01",
        email: "ibu.kos@mail.com",
        name: "Ibu Kos",
        whatsapp_number: "08123456789",
      });
      mockCookies.set("partner_token", { value: token });

      mockNotificationCount.mockResolvedValueOnce(1);
      mockNotificationFindMany.mockResolvedValueOnce([]);

      const req = new Request("http://localhost:3000/api/notifications?audience=OWNER");
      const res = await getNotifications(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockNotificationCount).toHaveBeenCalledWith({
        where: { owner_id: "own-01", is_read: false },
      });
    });

    it("menandai satu notifikasi sebagai sudah dibaca (PATCH /read)", async () => {
      const token = await signUserToken({
        userId: "u-01",
        email: "dimas@student.id",
        name: "Dimas",
      });
      mockCookies.set("user_token", { value: token });
      mockNotificationUpdateMany.mockResolvedValueOnce({ count: 1 });

      const req = new Request("http://localhost:3000/api/notifications/notif-1/read", {
        method: "PATCH",
      });
      const res = await markRead(req as any, {
        params: Promise.resolve({ id: "notif-1" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(true);
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "notif-1", user_id: "u-01", is_read: false },
        })
      );
    });

    it("menandai seluruh notifikasi sebagai dibaca (POST /read-all)", async () => {
      const token = await signUserToken({
        userId: "u-01",
        email: "dimas@student.id",
        name: "Dimas",
      });
      mockCookies.set("user_token", { value: token });
      mockNotificationUpdateMany.mockResolvedValueOnce({ count: 5 });

      const req = new Request("http://localhost:3000/api/notifications/read-all", {
        method: "POST",
      });
      const res = await markAllRead(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated_count).toBe(5);
    });
  });

  describe("Komponen UI <NotificationBell />", () => {
    it("merender tombol lonceng dengan aksesibilitas aria-label dan tanpa raw emoji", () => {
      const html = renderToStaticMarkup(<NotificationBell audience="USER" />);
      expect(html).toContain('aria-label="Buka Notifikasi"');
      expect(html).not.toContain("🔔");
      expect(html).not.toContain("🏡");
    });
  });
});

