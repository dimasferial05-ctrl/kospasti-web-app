import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe(".env.example Configuration Integrity Tests", () => {
  const envExamplePath = path.join(process.cwd(), ".env.example");
  const content = fs.readFileSync(envExamplePath, "utf-8");

  it("1. berkas .env.example harus mendefinisikan ADMIN_TOKEN", () => {
    expect(content).toMatch(/^ADMIN_TOKEN=/m);
  });

  it("2. berkas .env.example harus mendefinisikan JWT_SECRET", () => {
    expect(content).toMatch(/^JWT_SECRET=/m);
  });

  it("3. berkas .env.example harus mendefinisikan CRON_SECRET", () => {
    expect(content).toMatch(/^CRON_SECRET=/m);
  });

  it("4. berkas .env.example harus menyertakan komentar peringatan penggantian rahasia produksi", () => {
    expect(content).toMatch(/#.*(?:WAJIB|produksi|production)/i);
  });

  it("5. konfigurasi dasar database dan admin sebelumnya tetap terjaga", () => {
    expect(content).toMatch(/^DATABASE_URL=/m);
    expect(content).toMatch(/^ADMIN_EMAIL=/m);
    expect(content).toMatch(/^ADMIN_PASSWORD=/m);
  });
});
