import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/kos/", "/map", "/bantuan"],
        disallow: [
          "/admin/",
          "/admin/*",
          "/partner/dashboard/",
          "/partner/dashboard/*",
          "/partner/login",
          "/partner/register",
          "/api/",
          "/api/*",
          "/checkout/",
          "/checkout/*",
          "/profil",
          "/favorit",
          "/update/",
          "/booking/",
          "/success/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

