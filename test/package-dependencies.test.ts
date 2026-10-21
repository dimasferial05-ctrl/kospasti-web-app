import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Package Dependencies Architecture Tests", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const rawContent = fs.readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(rawContent);

  it("1. paket shadcn CLI tidak boleh ada di runtime dependencies", () => {
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies["shadcn"]).toBeUndefined();
  });

  it("2. paket shadcn harus berada di devDependencies", () => {
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies["shadcn"]).toBeDefined();
    expect(packageJson.devDependencies["shadcn"]).toContain("^4");
  });

  it("3. dependensi runtime utama tetap utuh dan lengkap", () => {
    expect(packageJson.dependencies["next"]).toBeDefined();
    expect(packageJson.dependencies["react"]).toBeDefined();
    expect(packageJson.dependencies["@prisma/client"]).toBeDefined();
    expect(packageJson.dependencies["tailwind-merge"]).toBeDefined();
  });
});
