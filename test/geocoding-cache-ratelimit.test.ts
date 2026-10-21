import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reverseGeocodeCoordinate,
  geocodeLocation,
  clearGeocodeCache,
  scheduleNominatimRequest,
} from "@/lib/geocoding";
import { GET } from "@/app/api/geocode/reverse/route";

describe("Geocoding In-Memory Cache and Rate Limiting Tests", () => {
  beforeEach(() => {
    clearGeocodeCache();
    vi.restoreAllMocks();
  });

  it("1. reverse geocoding menyimpan dan mengembalikan hasil dari in-memory cache", async () => {
    const lat = -6.5715;
    const lng = 107.7587;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: "Alun-alun Subang, Jawa Barat",
        address: { city: "Subang" },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Pemanggilan pertama -> mengambil dari jaringan (Nominatim)
    const first = await reverseGeocodeCoordinate(lat, lng);
    expect(first.success).toBe(true);
    expect(first.address).toBe("Alun-alun Subang, Jawa Barat");
    expect(first.source).toBe("nominatim");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Pemanggilan kedua -> harus mengambil langsung dari cache tanpa memanggil fetch lagi
    const second = await reverseGeocodeCoordinate(lat, lng);
    expect(second.success).toBe(true);
    expect(second.address).toBe("Alun-alun Subang, Jawa Barat");
    expect(second.source).toBe("cache");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("2. reverse geocoding memanfaatkan pembulatan koordinat 4 desimal untuk cache hit", async () => {
    const lat1 = -6.57151;
    const lng1 = 107.75871;
    const lat2 = -6.57154; // sama saat dibulatkan 4 desimal (-6.5715, 107.7587)
    const lng2 = 107.75874;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: "Titik Terdekat Subang",
        address: { county: "Subang" },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const first = await reverseGeocodeCoordinate(lat1, lng1);
    expect(first.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const second = await reverseGeocodeCoordinate(lat2, lng2);
    expect(second.success).toBe(true);
    expect(second.source).toBe("cache");
    expect(second.address).toBe("Titik Terdekat Subang");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("3. utamakan Google Maps jika API key disediakan pada reverse geocode", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            formatted_address: "Jl. Otista No. 1, Subang",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await reverseGeocodeCoordinate(-6.56, 107.76, {
      apiKey: "fake-google-key",
    });

    expect(res.success).toBe(true);
    expect(res.source).toBe("google");
    expect(res.address).toBe("Jl. Otista No. 1, Subang");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("maps.googleapis.com")
    );
  });

  it("4. forward geocoding memanfaatkan cache in-memory", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "-6.5715",
          lon: "107.7587",
          display_name: "Jalan Dangdeur Baru, Subang",
        },
      ],
    });
    vi.stubGlobal("fetch", mockFetch);

    const first = await geocodeLocation("Jalan Dangdeur Baru");
    expect(first).not.toBeNull();
    expect(first?.source).toBe("nominatim");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Query sama dengan perbedaan huruf besar/kecil harus hit cache
    const second = await geocodeLocation("jalan dangdeur baru");
    expect(second).not.toBeNull();
    expect(second?.lat).toBe(first?.lat);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("5. rate limiter scheduleNominatimRequest menjaga interval aman antar request", async () => {
    let callCount = 0;
    const timestamps: number[] = [];

    const task = async () => {
      callCount++;
      timestamps.push(Date.now());
      return callCount;
    };

    // Jalankan 2 request berturut-turut melalui scheduler
    const [p1, p2] = await Promise.all([
      scheduleNominatimRequest(task),
      scheduleNominatimRequest(task),
    ]);

    expect(p1).toBe(1);
    expect(p2).toBe(2);
    expect(timestamps.length).toBe(2);
    // Interval antar pemanggilan minimal mendekati 1000ms
    const interval = timestamps[1] - timestamps[0];
    expect(interval).toBeGreaterThanOrEqual(950);
  });

  it("6. endpoint GET /api/geocode/reverse memvalidasi input parameter", async () => {
    const reqMissing = new Request("http://localhost/api/geocode/reverse");
    const resMissing = await GET(reqMissing);
    expect(resMissing.status).toBe(400);

    const reqInvalid = new Request(
      "http://localhost/api/geocode/reverse?lat=invalid&lng=107.7"
    );
    const resInvalid = await GET(reqInvalid);
    expect(resInvalid.status).toBe(400);
  });

  it("7. endpoint GET /api/geocode/reverse merespons sukses dengan format yang konsisten", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: "Pusat Kota Subang",
        address: { road: "Jl. Wangsaraja" },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const req = new Request(
      "http://localhost/api/geocode/reverse?lat=-6.5700&lng=107.7500"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.address).toBe("Pusat Kota Subang");
    expect(json.details).toBeDefined();
  });
});
