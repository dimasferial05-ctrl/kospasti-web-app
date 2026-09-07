import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "../src/middleware";

describe("Next.js Security Middleware (src/middleware.ts)", () => {
  it("memiliki konfigurasi matcher untuk /admin/:path* dan /api/admin/:path*", () => {
    expect(config.matcher).toBeDefined();
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/api/admin/:path*");
  });

  describe("Proteksi Endpoint API (/api/admin/*)", () => {
    it("mengembalikan status 401 Unauthorized jika cookie admin_token tidak ada pada request /api/admin/*", () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats");
      const response = middleware(request);

      expect(response.status).toBe(401);
    });

    it("mengizinkan akses ke /api/admin/login tanpa cookie admin_token", () => {
      const request = new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("mengizinkan akses ke /api/admin/* jika cookie admin_token valid disertakan", () => {
      const request = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Proteksi Routing UI Admin (/admin/*)", () => {
    it("melakukan redirect ke /admin/login jika pengguna mengakses /admin tanpa cookie admin_token", () => {
      const request = new NextRequest("http://localhost:3000/admin");
      const response = middleware(request);

      expect(response.status).toBe(307); // NextResponse.redirect default status
      expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("melakukan redirect ke /admin/login jika pengguna mengakses /admin/properties tanpa cookie admin_token", () => {
      const request = new NextRequest("http://localhost:3000/admin/properties");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("mengizinkan akses ke /admin/login tanpa cookie admin_token", () => {
      const request = new NextRequest("http://localhost:3000/admin/login");
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("mengalihkan pengguna dari /admin/login ke /admin jika sudah memiliki cookie admin_token valid", () => {
      const request = new NextRequest("http://localhost:3000/admin/login", {
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin");
    });

    it("mengizinkan akses ke halaman /admin jika memiliki cookie admin_token valid", () => {
      const request = new NextRequest("http://localhost:3000/admin", {
        headers: {
          cookie: "admin_token=kospasti_admin_authenticated",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
