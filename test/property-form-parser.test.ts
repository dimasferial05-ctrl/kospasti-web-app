import { describe, it, expect, vi } from "vitest";
import { parsePropertyPayload } from "@/lib/property-form-parser";
import { NextRequest } from "next/server";
import * as uploadModule from "@/lib/upload";

describe("Property Form Parser Unit Tests", () => {
  it("1. harus berhasil mem-parsing payload JSON dengan seluruh field", async () => {
    const payload = {
      name: "Kos Nyaman Subang",
      price_per_month: 750000,
      available_rooms: 5,
      gender_type: "CAMPUR",
      facilities: "WiFi, AC, Kasur",
      image_url: "https://example.com/cover.jpg",
      address: "Jl. Otto Iskandardinata No. 10",
      latitude: -6.5622,
      longitude: 107.768,
      owner_id: "owner-abc",
      is_pet_friendly: true,
      is_24_hours: true,
      description: "Kos dekat pusat kota",
      rules: "Dilarang merokok",
      rental_terms: "Bayar di awal",
      youtube_url: "https://youtube.com/watch?v=123",
      room_types: [
        {
          id: "rt-1",
          name: "Tipe Deluxe",
          price_per_month: 850000,
          available_rooms: 2,
          facilities: "AC, TV",
          specifications: "4x4 meter",
          image_url: "https://example.com/deluxe.jpg",
        },
      ],
      media: [
        "https://example.com/foto1.jpg",
        { url: "https://example.com/video1.mp4", type: "VIDEO" },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/admin/properties/123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const parsed = await parsePropertyPayload(req);

    expect(parsed.name).toBe("Kos Nyaman Subang");
    expect(parsed.price_per_month).toBe(750000);
    expect(parsed.available_rooms).toBe(5);
    expect(parsed.gender_type).toBe("CAMPUR");
    expect(parsed.facilities).toBe("WiFi, AC, Kasur");
    expect(parsed.image_url).toBe("https://example.com/cover.jpg");
    expect(parsed.address).toBe("Jl. Otto Iskandardinata No. 10");
    expect(parsed.latitude).toBe(-6.5622);
    expect(parsed.longitude).toBe(107.768);
    expect(parsed.owner_id).toBe("owner-abc");
    expect(parsed.is_pet_friendly).toBe(true);
    expect(parsed.is_24_hours).toBe(true);
    expect(parsed.description).toBe("Kos dekat pusat kota");
    expect(parsed.rules).toBe("Dilarang merokok");
    expect(parsed.rental_terms).toBe("Bayar di awal");
    expect(parsed.youtube_url).toBe("https://youtube.com/watch?v=123");

    expect(parsed.room_types).toHaveLength(1);
    expect(parsed.room_types?.[0].name).toBe("Tipe Deluxe");
    expect(parsed.room_types?.[0].price_per_month).toBe(850000);

    expect(parsed.newMediaToCreate).toHaveLength(2);
    expect(parsed.newMediaToCreate[0].url).toBe("https://example.com/foto1.jpg");
    expect(parsed.newMediaToCreate[1].type).toBe("VIDEO");
  });

  it("2. harus menangani JSON kosong atau invalid secara graceful", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/properties/123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    const parsed = await parsePropertyPayload(req);
    expect(parsed.name).toBeUndefined();
    expect(parsed.newMediaToCreate).toEqual([]);
  });

  it("3. harus berhasil mem-parsing multipart/form-data dengan field teks dan file media", async () => {
    // Mock saveUploadedFiles and saveUploadedFile
    vi.spyOn(uploadModule, "saveUploadedFile").mockResolvedValue({
      url: "/uploads/properties/mock-room-type.jpg",
      type: "IMAGE",
    });

    vi.spyOn(uploadModule, "saveUploadedFiles").mockResolvedValue([
      { url: "/uploads/properties/mock-media-1.jpg", type: "IMAGE" },
    ]);

    const formData = new FormData();
    formData.append("name", "Kos Subang Permai");
    formData.append("price_per_month", "650000");
    formData.append("is_pet_friendly", "true");
    formData.append("is_24_hours", "1");
    formData.append(
      "room_types",
      JSON.stringify([
        {
          name: "Standard Room",
          price_per_month: 650000,
          available_rooms: 3,
        },
      ])
    );

    // Mock upload file
    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    formData.append("media", file);
    formData.append("media", "https://example.com/existing.jpg");

    const req = new NextRequest("http://localhost:3000/api/partner/properties/456", {
      method: "PATCH",
      body: formData,
    });

    const parsed = await parsePropertyPayload(req);

    expect(parsed.name).toBe("Kos Subang Permai");
    expect(parsed.price_per_month).toBe("650000");
    expect(parsed.is_pet_friendly).toBe(true);
    expect(parsed.is_24_hours).toBe(true);
    expect(parsed.room_types).toHaveLength(1);
    expect(parsed.room_types?.[0].name).toBe("Standard Room");

    // 1 dari validFiles (mock-media-1.jpg) dan 1 dari string url (existing.jpg)
    expect(parsed.newMediaToCreate).toHaveLength(2);
    expect(parsed.newMediaToCreate.some((m) => m.url.includes("mock-media-1"))).toBe(true);
    expect(parsed.newMediaToCreate.some((m) => m.url === "https://example.com/existing.jpg")).toBe(true);

    vi.restoreAllMocks();
  });
});
