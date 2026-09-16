import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../src/app/api/auth/me/route";
import * as nextHeaders from "next/headers";
import { signUserToken } from "../src/lib/auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan { authenticated: false, user: null } jika cookie user_token tidak ada", async () => {
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue(undefined),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.authenticated).toBe(false);
    expect(json.user).toBeNull();
  });

  it("mengembalikan { authenticated: false, user: null } jika user_token tidak valid", async () => {
    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: "invalid-token" }),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.authenticated).toBe(false);
    expect(json.user).toBeNull();
  });

  it("mengembalikan data pengguna dan { authenticated: true } jika user_token valid", async () => {
    const validToken = await signUserToken({
      userId: "user-uuid-123",
      email: "budi@example.com",
      name: "Budi Santoso",
      whatsapp: "081234567890",
    });

    (nextHeaders.cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: validToken }),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.authenticated).toBe(true);
    expect(json.user).toEqual({
      id: "user-uuid-123",
      email: "budi@example.com",
      name: "Budi Santoso",
      whatsapp: "081234567890",
    });
  });
});
