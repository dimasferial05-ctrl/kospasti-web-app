import { describe, it, expect } from "vitest";
import { POST as logoutPOST } from "../src/app/api/logout/route";

describe("User Logout API Endpoint (/api/logout)", () => {
  it("mengembalikan status 200 dan menghapus cookie user_token", async () => {
    const response = await logoutPOST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Berhasil keluar dari akun.");

    const cookiesHeader = response.headers.get("set-cookie");
    expect(cookiesHeader).toBeDefined();
    expect(cookiesHeader).toContain("user_token=");
    expect(cookiesHeader?.toLowerCase()).toContain("httponly");
    expect(cookiesHeader?.toLowerCase()).toContain("max-age=0");
  });

  it("dapat dipanggil tanpa parameter request", async () => {
    const response = await logoutPOST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Berhasil keluar dari akun.");
  });
});
