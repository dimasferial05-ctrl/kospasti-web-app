import { prisma } from "../src/lib/prisma";

export async function clearDatabase() {
  await prisma.booking.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.propertyMedia.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();
}
