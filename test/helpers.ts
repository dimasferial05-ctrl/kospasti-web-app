import { prisma } from "../src/lib/prisma";

export async function clearDatabase() {
  const url = process.env.DATABASE_URL || "";
  // HARD SAFETY GUARD: Dilarang keras membersihkan database utama/produksi (public schema)
  if (!url.includes("schema=test") && !url.includes("test.db")) {
    console.warn("⚠️ [SAFETY GUARD] clearDatabase() ditolak: DATABASE_URL tidak mengarah ke isolated test schema (test_suite) atau test.db!");
    return;
  }

  try {
    await Promise.allSettled([
      prisma.chatMessage?.deleteMany().catch(() => {}),
      prisma.chatRoom?.deleteMany().catch(() => {}),
      prisma.notification?.deleteMany().catch(() => {}),
      prisma.visitSchedule?.deleteMany().catch(() => {}),
      prisma.review?.deleteMany().catch(() => {}),
      prisma.payout?.deleteMany().catch(() => {}),
      prisma.payoutMethod?.deleteMany().catch(() => {}),
      prisma.booking?.deleteMany().catch(() => {}),
      prisma.magicLink?.deleteMany().catch(() => {}),
      prisma.propertyMedia?.deleteMany().catch(() => {}),
      prisma.savedProperty?.deleteMany().catch(() => {}),
      prisma.roomType?.deleteMany().catch(() => {}),
      prisma.property?.deleteMany().catch(() => {}),
      prisma.owner?.deleteMany().catch(() => {}),
      prisma.user?.deleteMany().catch(() => {}),
    ]);
  } catch (error) {
    console.warn("⚠️ [OFFLINE NOTICE] clearDatabase() dilewati atau mengalami kendala koneksi:", error);
  }
}
