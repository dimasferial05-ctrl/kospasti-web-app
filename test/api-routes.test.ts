import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/routes/route";
import { NextRequest } from "next/server";

describe("POST /api/routes - Google Routes API v2 & Haversine Fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan status 400 jika koordinat origin atau destination tidak lengkap", async () => {
    const req = new NextRequest("http://localhost:3000/api/routes", {
      method: "POST",
      body: JSON.stringify({
        origin: { lat: -6.2 },
        // destination missing
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Origin dan destination harus memiliki koordinat");
  });

  it("berhasil menghitung jarak dan durasi estimasi via fallback Haversine saat koordinat valid", async () => {
    const req = new NextRequest("http://localhost:3000/api/routes", {
      method: "POST",
      body: JSON.stringify({
        origin: { lat: -6.2088, lng: 106.8456 },
        destination: { lat: -6.2188, lng: 106.8556 },
        travelMode: "DRIVING",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.distance).toBeDefined();
    expect(data.data.duration).toBeDefined();
  });

  it("mendukung mode perjalanan WALKING", async () => {
    const req = new NextRequest("http://localhost:3000/api/routes", {
      method: "POST",
      body: JSON.stringify({
        origin: { lat: -6.2088, lng: 106.8456 },
        destination: { lat: -6.2188, lng: 106.8556 },
        travelMode: "WALKING",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.duration).toBeDefined();
  });
});
