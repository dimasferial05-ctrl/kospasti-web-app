import { execSync } from "child_process";

export default function setup() {
  try {
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    execSync("npx prisma db push --skip-generate", {
      stdio: "pipe",
      env: { ...process.env },
    });
  } catch {
    // Abaikan jika prisma provider berbeda dengan format DATABASE_URL saat testing
  }
}
