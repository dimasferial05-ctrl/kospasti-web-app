import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com").replace(/\/+$/, "");

  // 1. Rute Statis Utama
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bantuan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/syarat-ketentuan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/kebijakan-privasi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/kebijakan-refund`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Rute Dinamis Kos (Status PUBLISHED)
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updated_at: true },
    });

    propertyRoutes = properties.map((prop) => ({
      url: `${baseUrl}/kos/${prop.id}`,
      lastModified: prop.updated_at || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[SITEMAP] Gagal mengambil rute properti:", err);
  }

  // 3. Rute Dinamis Pencarian Per Wilayah
  let locationRoutes: MetadataRoute.Sitemap = [];
  try {
    const locations = await prisma.location.findMany({
      where: { is_active: true },
      select: { name: true, updated_at: true },
      take: 50,
    });

    const rawNames =
      locations.length > 0
        ? locations.map((l) => l.name.trim()).filter(Boolean)
        : ["Subang Kota", "Polsub", "Kalijati", "Cibogo", "Pagaden", "Dawuan"];

    const uniqueLocationNames = Array.from(new Set(rawNames));

    locationRoutes = uniqueLocationNames.map((loc) => ({
      url: `${baseUrl}/search?q=${encodeURIComponent(loc)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error("[SITEMAP] Gagal mengambil rute lokasi:", err);
  }

  return [...staticRoutes, ...propertyRoutes, ...locationRoutes];
}

