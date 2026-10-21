import fs from "fs";
import path from "path";

export function toTestDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  if (rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://")) {
    try {
      const parsed = new URL(rawUrl);
      parsed.searchParams.set("schema", "test_suite");
      return parsed.toString();
    } catch {
      if (rawUrl.includes("schema=")) {
        return rawUrl.replace(/([?&])schema=[^&]+/, "$1schema=test_suite");
      }
      return rawUrl.includes("?") ? `${rawUrl}&schema=test_suite` : `${rawUrl}?schema=test_suite`;
    }
  }
  return rawUrl;
}

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
}
