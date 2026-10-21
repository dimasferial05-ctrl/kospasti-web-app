import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { GET as adminReviewsGET } from "@/app/api/admin/reviews/route";
import { PATCH as adminReviewPATCH } from "@/app/api/admin/reviews/[id]/route";
import { prisma } from "@/lib/prisma";

describe("Admin Reviews Authentication Token Integrity (Issue #307)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. berkas test/reviews.test.ts tidak lagi berisi cookie mock_admin_token usang", () => {
    const filePath = path.join(process.cwd(), "test/reviews.test.ts");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain("mock_admin_token");
    expect(content).toContain("admin_token=kospasti_admin_authenticated");
  });

  it("2. GET /api/admin/reviews menerima token kospasti_admin_authenticated dan menolak token lama", async () => {
    vi.spyOn(prisma.review, "findMany").mockResolvedValue([] as unknown as never);

    // Request dengan token resmi baru
    const validReq = new NextRequest("http://localhost/api/admin/reviews", {
      headers: { cookie: "admin_token=kospasti_admin_authenticated" },
    });
    const validRes = await adminReviewsGET(validReq);
    expect(validRes.status).toBe(200);

    // Request dengan token lama yang salah
    const invalidReq = new NextRequest("http://localhost/api/admin/reviews", {
      headers: { cookie: "admin_token=mock_admin_token" },
    });
    const invalidRes = await adminReviewsGET(invalidReq);
    expect(invalidRes.status).toBe(401);
  });

  it("3. PATCH /api/admin/reviews/[id] menerima token kospasti_admin_authenticated dan menolak token lama", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      id: "rev-1",
      is_hidden: false,
    } as unknown as never);
    vi.spyOn(prisma.review, "update").mockResolvedValue({
      id: "rev-1",
      is_hidden: true,
    } as unknown as never);

    // Request dengan token resmi baru
    const validReq = new NextRequest("http://localhost/api/admin/reviews/rev-1", {
      method: "PATCH",
      headers: { cookie: "admin_token=kospasti_admin_authenticated" },
      body: JSON.stringify({ is_hidden: true }),
    });
    const validRes = await adminReviewPATCH(validReq, {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(validRes.status).toBe(200);

    // Request dengan token lama yang salah
    const invalidReq = new NextRequest("http://localhost/api/admin/reviews/rev-1", {
      method: "PATCH",
      headers: { cookie: "admin_token=mock_admin_token" },
      body: JSON.stringify({ is_hidden: true }),
    });
    const invalidRes = await adminReviewPATCH(invalidReq, {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(invalidRes.status).toBe(401);
  });
});
