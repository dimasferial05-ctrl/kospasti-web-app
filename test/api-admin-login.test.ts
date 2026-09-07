import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as loginPOST } from "../src/app/api/admin/login/route";
import { POST as logoutPOST } from "../src/app/api/admin/logout/route";

describe("Admin Authentication API Endpoints (/api/admin/login & /api/admin/logout)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/admin/login", () => {
    it("mengembalikan status 401 jika PIN tidak dikirimkan atau kosong", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("PIN salah");
    });

    it("mengembalikan status 401 jika PIN salah", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin: "000000" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain("PIN salah. Akses ditolak.");
    });

    it("mengembalikan status 200 dan memasang cookie HTTP-Only admin_token jika PIN benar", async () => {
      const request = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin: "778899" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Login admin berhasil.");

      const cookie = response.cookies.get("admin_token");
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe("kospasti_admin_authenticated");
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.path).toBe("/");
    });
  });

  describe("POST /api/admin/logout", () => {
    it("mengembalikan status 200 dan menghapus cookie admin_token", async () => {
      const response = await logoutPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Logout admin berhasil.");

      // Cookie deletion in Next.js response
      const cookie = response.cookies.get("admin_token");
      expect(cookie?.value === "" || cookie?.maxAge === 0 || !cookie).toBe(true);
    });
  });
});
