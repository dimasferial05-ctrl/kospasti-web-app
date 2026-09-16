import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export default function setup() {
  try {
    if (!process.env.DATABASE_URL) {
      const envPath = path.resolve(__dirname, "../.env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
        if (match && match[1]) {
          process.env.DATABASE_URL = match[1];
        }
      }
    }

    if (process.env.DATABASE_URL) {
      execSync("npx prisma db push --skip-generate", {
        stdio: "pipe",
        env: { ...process.env },
      });
    }
  } catch {
    // Abaikan jika database push gagal di environment testing
  }
}
