import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import RegisterPage from "../src/app/register/page";
import { redirect } from "next/navigation";

describe("Register Page UI (/register) - Google SSO Redirect", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mengarahkan pengguna secara otomatis ke /login dengan mempertahankan callbackUrl", async () => {
    try {
      await RegisterPage({
        searchParams: Promise.resolve({ callbackUrl: "/kos/abc" }),
      });
    } catch (err: unknown) {
      expect((err as Error).message).toBe("NEXT_REDIRECT:/login?callbackUrl=%2Fkos%2Fabc");
    }

    expect(redirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fkos%2Fabc");
  });

  it("menggunakan default '/' sebagai callbackUrl jika tidak ada parameter", async () => {
    try {
      await RegisterPage({
        searchParams: Promise.resolve({}),
      });
    } catch (err: unknown) {
      expect((err as Error).message).toBe("NEXT_REDIRECT:/login?callbackUrl=%2F");
    }

    expect(redirect).toHaveBeenCalledWith("/login?callbackUrl=%2F");
  });
});
