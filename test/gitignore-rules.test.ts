import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Gitignore Configuration Rules", () => {
  it("harus menyertakan skills-lock.json dalam daftar pengabaian", () => {
    const gitignorePath = path.resolve(process.cwd(), ".gitignore");
    const content = fs.readFileSync(gitignorePath, "utf-8");
    const lines = content.split("\n").map((line) => line.trim());

    expect(lines).toContain("skills-lock.json");
  });
});
