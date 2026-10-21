import { prisma } from "../src/lib/prisma";

export async function clearDatabase() {
  const url = process.env.DATABASE_URL || "";
  // HARD SAFETY GUARD: Dilarang keras membersihkan database utama/produksi (public schema)
  if (!url.includes("schema=test") && !url.includes("test.db")) {
    console.warn("⚠️ [SAFETY GUARD] clearDatabase() ditolak: DATABASE_URL tidak mengarah ke isolated test schema (test_suite) atau test.db!");
    return;
  }

  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.savedProperty.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();
}
