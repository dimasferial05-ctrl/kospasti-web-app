import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        image_url: true,
        price_per_month: true,
        gender_type: true,
      },
    });

    if (!property) {
      return {
        title: "Kos Tidak Ditemukan - KosPasti",
        description: "Detail properti kos tidak ditemukan di sistem KosPasti.",
      };
    }

    const title = `${property.name} - Sewa Kos di KosPasti`;
    const formattedPrice = new Intl.NumberFormat("id-ID").format(property.price_per_month);
    const description =
      property.description?.slice(0, 160) ||
      `Sewa kos ${property.name} (${property.gender_type}) mulai dari Rp ${formattedPrice}/bulan dengan jaminan ketersediaan kamar real-time di KosPasti.`;
    const imageUrl = property.image_url || "/icons/icon-512x512.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: property.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: "Detail Kos - KosPasti",
      description: "Platform pencarian kos dengan kepastian kamar real-time.",
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
