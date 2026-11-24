import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getKycStatus, POST as submitKyc } from "@/app/api/user/kyc/route";
import { prisma } from "@/lib/prisma";
import * as authLib from "@/lib/auth";
import * as kycAiLib from "@/lib/kyc-ai";
import * as uploadLib from "@/lib/upload";
import * as notificationsLib from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/notifications", () => ({
  createInAppNotification: vi.fn().mockResolvedValue({ id: "notif-123" }),
}));

vi.mock("@/lib/upload", () => ({
  saveUploadedFile: vi.fn().mockResolvedValue({
    url: "https://mock-supabase.co/storage/v1/object/public/kospasti-media/kyc/ktp-123.jpg",
    type: "IMAGE",
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === "user_token") return { value: "valid_user_token_123" };
      return undefined;
    }),
  }),
}));

describe("Verifikasi Identitas Cerdas Penyewa (AI-Assisted Tenant KYC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Helper & Algoritma Kecocokan Nama (calculateNameSimilarity)", () => {
    it("Menghitung skor 1.0 jika nama sama persis", () => {
      expect(kycAiLib.calculateNameSimilarity("Dimas Ferial", "Dimas Ferial")).toBe(1.0);
    });

    it("Toleran terhadap perbedaan huruf besar/kecil dan spasi", () => {
      expect(kycAiLib.calculateNameSimilarity("dimas ferial", "DIMAS   FERIAL")).toBe(1.0);
    });

    it("Memberikan skor tinggi jika nama akun merupakan substring dari nama KTP", () => {
      const score = kycAiLib.calculateNameSimilarity("Dimas Ferial", "Dimas Ferial Pangestu");
      expect(score).toBeGreaterThanOrEqual(0.75);
    });

    it("Memberikan skor rendah jika nama sangat berbeda", () => {
      const score = kycAiLib.calculateNameSimilarity("Dimas Ferial", "Siti Aminah");
      expect(score).toBeLessThan(0.5);
    });

    it("Masking NIK/NIM berfungsi menyamarkan digit tengah demi privasi UU PDP", () => {
      expect(kycAiLib.maskIdNumber("3171012345670001")).toBe("317101******0001");
      expect(kycAiLib.maskIdNumber("21000189")).toBe("21****89");
      expect(kycAiLib.maskIdNumber(null)).toBe("-");
    });
  });

  describe("2. GET /api/user/kyc", () => {
    it("Mengembalikan 401 jika pengguna belum terotentikasi", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue(null);

      const res = await getKycStatus();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("Mengembalikan data KYC dan NIK tersamar jika user memiliki riwayat verifikasi", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-123",
        name: "Dimas Ferial",
        email: "dimas@mail.com",
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Dimas Ferial",
        is_identity_verified: true,
        verified_at: new Date(),
        identity_verification: {
          id: "kyc-1",
          document_type: "KTP",
          document_photo_url: "https://mock.com/ktp.jpg",
          extracted_name: "Dimas Ferial",
          extracted_id_number: "3171012345670001",
          extracted_institution: null,
          match_confidence: 1.0,
          verification_status: "VERIFIED",
          rejection_reason: null,
          verified_at: new Date(),
          created_at: new Date(),
        },
      } as any);

      const res = await getKycStatus();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.is_identity_verified).toBe(true);
      expect(data.verification.masked_id_number).toBe("317101******0001");
    });
  });

  describe("3. POST /api/user/kyc", () => {
    it("Menolak pengunggahan jika file foto tidak disertakan", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-123",
        name: "Dimas Ferial",
        email: "dimas@mail.com",
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Dimas Ferial",
        is_identity_verified: false,
      } as any);

      const formData = new FormData();
      formData.append("document_type", "KTP");

      const req = new Request("http://localhost:3000/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      const res = await submitKyc(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("wajib diunggah");
    });

    it("Menolak jika dokumen dinyatakan bukan kartu identitas asli oleh AI Gemini", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-123",
        name: "Dimas Ferial",
        email: "dimas@mail.com",
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Dimas Ferial",
        is_identity_verified: false,
      } as any);

      vi.spyOn(kycAiLib, "extractIdentityCardData").mockResolvedValue({
        document_type: "UNKNOWN",
        full_name: null,
        id_number: null,
        institution: null,
        is_authentic_document: false,
        notes: "Gambar adalah foto pemandangan, bukan kartu identitas",
      });

      vi.spyOn(prisma.tenantIdentityVerification, "upsert").mockResolvedValue({
        id: "kyc-rejected",
        verification_status: "REJECTED",
      } as any);

      const fakeFile = new File(["dummy content"], "gambar-kucing.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("document_type", "KTP");
      formData.append("document_file", fakeFile);

      const req = new Request("http://localhost:3000/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      const res = await submitKyc(req);
      const data = await res.json();

      expect(res.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("tidak dikenali");
    });

    it("Menolak verifikasi jika nama di KTP tidak cocok dengan nama akun pengguna", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-123",
        name: "Dimas Ferial",
        email: "dimas@mail.com",
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Dimas Ferial",
        is_identity_verified: false,
      } as any);

      vi.spyOn(kycAiLib, "extractIdentityCardData").mockResolvedValue({
        document_type: "KTP",
        full_name: "Budi Santoso",
        id_number: "3171019999990001",
        institution: null,
        is_authentic_document: true,
        notes: "KTP valid",
      });

      vi.spyOn(prisma.tenantIdentityVerification, "upsert").mockResolvedValue({
        id: "kyc-rejected",
        verification_status: "REJECTED",
        extracted_id_number: "3171019999990001",
      } as any);

      const fakeFile = new File(["dummy content"], "ktp-budi.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("document_type", "KTP");
      formData.append("document_file", fakeFile);

      const req = new Request("http://localhost:3000/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      const res = await submitKyc(req);
      const data = await res.json();

      expect(res.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("tidak sesuai");
    });

    it("Berhasil memverifikasi identitas jika nama di KTP/KTM cocok dengan akun", async () => {
      vi.spyOn(authLib, "verifyUserToken").mockResolvedValue({
        userId: "user-123",
        name: "Dimas Ferial",
        email: "dimas@mail.com",
      } as any);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: "user-123",
        name: "Dimas Ferial",
        is_identity_verified: false,
      } as any);

      vi.spyOn(kycAiLib, "extractIdentityCardData").mockResolvedValue({
        document_type: "KTP",
        full_name: "Dimas Ferial",
        id_number: "3171012345670001",
        institution: null,
        is_authentic_document: true,
        notes: "KTP valid dan jelas",
      });

      vi.spyOn(prisma.tenantIdentityVerification, "upsert").mockResolvedValue({
        id: "kyc-success",
        verification_status: "VERIFIED",
        extracted_name: "Dimas Ferial",
        extracted_id_number: "3171012345670001",
      } as any);

      vi.spyOn(prisma.user, "update").mockResolvedValue({
        id: "user-123",
        is_identity_verified: true,
      } as any);

      const fakeFile = new File(["dummy content"], "ktp-dimas.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("document_type", "KTP");
      formData.append("document_file", fakeFile);

      const req = new Request("http://localhost:3000/api/user/kyc", {
        method: "POST",
        body: formData,
      });

      const res = await submitKyc(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.verification.verification_status).toBe("VERIFIED");
      expect(data.verification.masked_id_number).toBe("317101******0001");
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_identity_verified: true }),
        })
      );
      expect(notificationsLib.createInAppNotification).toHaveBeenCalled();
    });
  });
});
