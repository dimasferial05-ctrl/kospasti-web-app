import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { toTestDatabaseUrl } from "./setup-env";

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
      process.env.DATABASE_URL = toTestDatabaseUrl(process.env.DATABASE_URL);

      if (process.env.FORCE_DB_PUSH === "true") {
        execSync("npx prisma db push --skip-generate", {
          stdio: "pipe",
          env: { ...process.env },
        });
      }
    }
  } catch {
    // Abaikan jika database push gagal di environment testing
  }
}
