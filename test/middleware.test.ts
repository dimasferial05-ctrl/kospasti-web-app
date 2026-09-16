import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "../src/middleware";

describe("Next.js Security Middleware (src/middleware.ts)", () => {
  it("memiliki konfigurasi matcher untuk rute admin, auth pengguna, dan rute pengguna terproteksi", () => {
    expect(config.matcher).toBeDefined();
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/api/admin/:path*");
    expect(config.matcher).toContain("/login");
    expect(config.matcher).toContain("/register");
    expect(config.matcher).toContain("/profil/:path*");
    expect(config.matcher).toContain("/pesanan/:path*");
    expect(config.matcher).toContain("/checkout/:path*");
  });

  describe("Proteksi Endpoint API Admin (/api/admin/*)", () => {
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

  describe("Proteksi Halaman Auth Pengguna (/login & /register) - Issue #132 & #138", () => {
    it("mengizinkan akses ke /login jika pengguna belum login (tidak ada user_token)", () => {
      const request = new NextRequest("http://localhost:3000/login");
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("mengizinkan akses ke /register jika pengguna belum login (tidak ada user_token)", () => {
      const request = new NextRequest("http://localhost:3000/register");
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("mengalihkan ke halaman utama (/) jika pengguna yang sudah login mengakses /login tanpa callbackUrl", () => {
      const request = new NextRequest("http://localhost:3000/login", {
        headers: {
          cookie: "user_token=mock_jwt_token_user_123",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });

    it("mengalihkan ke callbackUrl jika pengguna yang sudah login mengakses /login dengan callbackUrl valid", () => {
      const request = new NextRequest(
        "http://localhost:3000/login?callbackUrl=%2Fpesanan%2F123",
        {
          headers: {
            cookie: "user_token=mock_jwt_token_user_123",
          },
        }
      );
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/pesanan/123");
    });

    it("mengalihkan ke halaman utama (/) jika pengguna yang sudah login mengakses /register", () => {
      const request = new NextRequest("http://localhost:3000/register", {
        headers: {
          cookie: "user_token=mock_jwt_token_user_123",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    });
  });

  describe("Proteksi Halaman Khusus Pengguna (/profil & /pesanan) - Issue #132 & #138", () => {
    it("mengalihkan ke /login dengan callbackUrl jika pengguna belum login mengakses /profil", () => {
      const request = new NextRequest("http://localhost:3000/profil");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fprofil"
      );
    });

    it("mengalihkan ke /login dengan callbackUrl jika pengguna belum login mengakses sub-rute /profil/edit", () => {
      const request = new NextRequest("http://localhost:3000/profil/edit");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fprofil%2Fedit"
      );
    });

    it("mengalihkan ke /login dengan callbackUrl jika pengguna belum login mengakses /pesanan", () => {
      const request = new NextRequest("http://localhost:3000/pesanan");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fpesanan"
      );
    });

    it("mengalihkan ke /login dengan callbackUrl jika pengguna belum login mengakses sub-rute /pesanan/123", () => {
      const request = new NextRequest("http://localhost:3000/pesanan/123");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fpesanan%2F123"
      );
    });

    it("mengalihkan ke /login dengan query string ter-encode jika mengakses rute dengan query params", () => {
      const request = new NextRequest(
        "http://localhost:3000/pesanan?tab=active&page=2"
      );
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fpesanan%3Ftab%3Dactive%26page%3D2"
      );
    });

    it("mengizinkan akses ke /profil jika pengguna sudah login (memiliki user_token)", () => {
      const request = new NextRequest("http://localhost:3000/profil", {
        headers: {
          cookie: "user_token=mock_jwt_token_user_123",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it("mengalihkan ke /login dengan callbackUrl jika pengguna belum login mengakses /checkout/123", () => {
      const request = new NextRequest("http://localhost:3000/checkout/123");
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?callbackUrl=%2Fcheckout%2F123"
      );
    });

    it("mengizinkan akses ke /checkout jika pengguna sudah login (memiliki user_token)", () => {
      const request = new NextRequest("http://localhost:3000/checkout/123", {
        headers: {
          cookie: "user_token=mock_jwt_token_user_123",
        },
      });
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });
});

