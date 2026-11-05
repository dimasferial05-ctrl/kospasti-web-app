import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kospasti.com").replace(/\/+$/, "");

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        price_per_month: true,
        available_rooms: true,
        image_url: true,
        facilities: true,
      },
    });

    if (!property) {
      return {
        title: "Kos Tidak Ditemukan - KosPasti",
        description: "Informasi kos tidak ditemukan atau sudah tidak tersedia.",
      };
    }

    const title = `${property.name} - Kos Murah Subang | KosPasti`;
    const priceFormatted = `Rp ${property.price_per_month.toLocaleString("id-ID")}/bulan`;
    const description = `Sewa kamar di ${property.name}, ${property.address || "Subang"}. Harga mulai ${priceFormatted}. Sisa kamar: ${property.available_rooms}. Fasilitas: ${property.facilities || "Lengkap"}. Jaminan kepastian kamar real-time.`;

    const fullImageUrl = property.image_url
      ? property.image_url.startsWith("http://") || property.image_url.startsWith("https://")
        ? property.image_url
        : `${baseUrl}${property.image_url.startsWith("/") ? "" : "/"}${property.image_url}`
      : `${baseUrl}/icons/icon-512x512.png`;

    return {
      title,
      description,
      openGraph: {
        title: `${property.name} | KosPasti Subang`,
        description,
        url: `${baseUrl}/kos/${property.id}`,
        siteName: "KosPasti",
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: property.name,
          },
        ],
        type: "website",
        locale: "id_ID",
      },
      twitter: {
        card: "summary_large_image",
        title: `${property.name} | KosPasti`,
        description,
        images: [fullImageUrl],
      },
    };
  } catch (err) {
    console.error("[SEO] Error generating metadata for property:", err);
    return {
      title: "Detail Kos - KosPasti",
      description: "Platform pencarian kos real-time dan terpercaya di Subang.",
    };
  }
}

export default function KosDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
