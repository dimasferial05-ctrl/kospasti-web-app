import { PrismaClient } from "@prisma/client";
import { LOCATION_DATA } from "../src/data/locationSuggestions";
import { COMMON_LOCATION_COORDINATES } from "../src/app/api/ai-search/route";

const prisma = new PrismaClient();
const DEFAULT_SUBANG_COORDS = { lat: -6.5590, lng: 107.7583 };

async function main() {
  console.log("📍 Memulai migrasi seed data lokasi Subang (batch mode)...");

  // Ambil semua lokasi yang sudah ada sekaligus (1 query tunggal)
  const existingLocations = await prisma.location.findMany({
    select: { name: true },
  });
  const existingNames = new Set(
    existingLocations.map((l) => l.name.toLowerCase().trim())
  );

  const toInsert: Array<{
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    aliases: string | null;
    subdistrict: string;
    is_active: boolean;
  }> = [];

  const seenInBatch = new Set<string>();

  for (const item of LOCATION_DATA) {
    const nameLower = item.label.toLowerCase().trim();
    if (existingNames.has(nameLower) || seenInBatch.has(nameLower)) {
      continue;
    }
    seenInBatch.add(nameLower);

    const keyLower = item.key.toLowerCase().trim();
    const coord =
      COMMON_LOCATION_COORDINATES[keyLower] ||
      COMMON_LOCATION_COORDINATES[nameLower] ||
      DEFAULT_SUBANG_COORDS;

    const aliasStr = keyLower !== nameLower ? keyLower : null;

    toInsert.push({
      name: item.label,
      category: item.category,
      latitude: coord.lat,
      longitude: coord.lng,
      aliases: aliasStr,
      subdistrict: "Subang",
      is_active: true,
    });
  }

  if (toInsert.length > 0) {
    const result = await prisma.location.createMany({
      data: toInsert,
      skipDuplicates: true,
    });
    console.log(
      `✅ Sukses seeding! ${result.count} data lokasi berhasil dimasukkan ke database.`
    );
  } else {
    console.log(
      `✅ Seluruh lokasi (${existingLocations.length}) sudah ada di database.`
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding lokasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
