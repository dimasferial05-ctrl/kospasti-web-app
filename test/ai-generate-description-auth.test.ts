import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/ai/generate-description/route";
import * as nextHeaders from "next/headers";
import * as authLib from "@/lib/auth";
import * as adminAuthLib from "@/lib/admin-auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("AI Generate Description Authentication & Authorization (Issue #277)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      ADMIN_TOKEN: "kospasti_admin_authenticated",
      // Pastikan GEMINI_API_KEY kosong agar test menggunakan fallbackDescriptionTemplate yang deterministik
      GEMINI_API_KEY: "",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (body: Record<string, unknown> = {}, headers: Record<string, string> = {}) => {
    return new Request("http://localhost:3000/api/ai/generate-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        name: "Kos Melati Nyaman",
        facilities: "WiFi, AC, Kamar Mandi Dalam",
        price_per_month: 1200000,
        gender_type: "PUTRI",
        address: "Jl. Otto Iskandardinata No. 45, Subang",
        is_pet_friendly: false,
        is_24_hours: true,
        ...body,
      }),
    });
  };

  describe("Skenario Penolakan Akses Tanpa Autentikasi (401 Unauthorized)", () => {
    it("Menolak permintaan jika tidak ada cookie partner_token maupun admin_token", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized: Anda harus login sebagai mitra atau admin");
    });

    it("Menolak permintaan jika token mitra tidak valid atau kedaluwarsa", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "partner_token") return { value: "invalid_partner_token" };
          return undefined;
        }),
      });

      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue(null);

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("Menolak permintaan jika token admin pada cookie tidak cocok", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "admin_token") return { value: "wrong_admin_token" };
          return undefined;
        }),
      });

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });
  });

  describe("Skenario Penerimaan Akses Sah (200 OK)", () => {
    it("Menerima permintaan jika pengguna memiliki sesi mitra (partner_token) yang sah", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "partner_token") return { value: "valid_owner_jwt" };
          return undefined;
        }),
      });

      vi.spyOn(authLib, "verifyOwnerToken").mockResolvedValue({
        ownerId: "owner-uuid-456",
        email: "mitra@kospasti.com",
        name: "Pak Budi",
        whatsapp_number: "08123456789",
        role: "OWNER",
      });

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.description).toBeDefined();
      expect(data.description).toContain("Kos Melati Nyaman");
      expect(data.description).toContain("khusus putri");
    });

    it("Menerima permintaan jika pengguna memiliki sesi admin (admin_token) yang sah pada cookie", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockImplementation((name: string) => {
          if (name === "admin_token") return { value: "kospasti_admin_authenticated" };
          return undefined;
        }),
      });

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.description).toBeDefined();
      expect(data.description).toContain("Kos Melati Nyaman");
    });

    it("Menerima permintaan jika admin terotentikasi melalui isValidAdminRequest pada header cookie", async () => {
      (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      vi.spyOn(adminAuthLib, "isValidAdminRequest").mockReturnValue(true);

      const req = createMockRequest();
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.description).toBeDefined();
    });
  });
});
