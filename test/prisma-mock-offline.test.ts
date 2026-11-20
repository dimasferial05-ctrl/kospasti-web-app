import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, mockPrisma } from "./mocks/prisma";
import { toTestDatabaseUrl } from "./setup-env";
import { clearDatabase } from "./helpers";

describe("Prisma Mock Utility & Offline Testing Reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMockPrisma()", () => {
    it("provides mocks for all core application models", () => {
      const mock = createMockPrisma();

      const expectedModels = [
        "owner",
        "property",
        "roomType",
        "propertyMedia",
        "magicLink",
        "booking",
        "user",
        "savedProperty",
        "review",
        "payoutMethod",
        "payout",
        "location",
        "notification",
        "visitSchedule",
        "chatRoom",
        "chatMessage",
      ] as const;

      for (const model of expectedModels) {
        expect(mock).toHaveProperty(model);
        expect(typeof (mock as any)[model].findUnique).toBe("function");
        expect(typeof (mock as any)[model].findMany).toBe("function");
        expect(typeof (mock as any)[model].create).toBe("function");
        expect(typeof (mock as any)[model].update).toBe("function");
        expect(typeof (mock as any)[model].delete).toBe("function");
        expect(typeof (mock as any)[model].deleteMany).toBe("function");
        expect(typeof (mock as any)[model].count).toBe("function");
      }
    });

    it("handles $transaction with array of promises", async () => {
      const mock = createMockPrisma();
      const p1 = Promise.resolve({ id: "1" });
      const p2 = Promise.resolve({ id: "2" });

      const result = await mock.$transaction([p1, p2]);
      expect(result).toEqual([{ id: "1" }, { id: "2" }]);
    });

    it("handles $transaction with interactive callback passing prisma mock", async () => {
      const mock = createMockPrisma();
      (mock.property.create as any).mockResolvedValue({ id: "prop-new" });

      const result = await mock.$transaction(async (tx: any) => {
        return tx.property.create({ data: { name: "Test Kos" } });
      });

      expect(result).toEqual({ id: "prop-new" });
      expect(mock.property.create).toHaveBeenCalledWith({ data: { name: "Test Kos" } });
    });

    it("supports $queryRaw and $executeRaw mocks", async () => {
      const mock = createMockPrisma();
      const rawResult = await mock.$queryRaw`SELECT 1`;
      const execResult = await mock.$executeRaw`DELETE FROM Test`;

      expect(rawResult).toEqual([]);
      expect(execResult).toBe(0);
    });
  });

  describe("toTestDatabaseUrl()", () => {
    it("appends schema=test_suite if url has no query params", () => {
      const url = "postgresql://user:pass@localhost:5432/mydb";
      const result = toTestDatabaseUrl(url);
      expect(result).toContain("schema=test_suite");
    });

    it("updates existing schema parameter to test_suite", () => {
      const url = "postgresql://user:pass@localhost:5432/mydb?schema=public&sslmode=require";
      const result = toTestDatabaseUrl(url);
      expect(result).toContain("schema=test_suite");
      expect(result).not.toContain("schema=public");
    });

    it("returns original url for non-postgres urls", () => {
      const url = "file:./dev.db";
      expect(toTestDatabaseUrl(url)).toBe(url);
    });
  });

  describe("clearDatabase() Graceful Error Handling", () => {
    it("handles disconnected or rejected database queries without throwing fatal error", async () => {
      // Set test url
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/mydb?schema=test_suite";

      // Memanggil clearDatabase tidak boleh melempar exception meskipun koneksi offline
      await expect(clearDatabase()).resolves.not.toThrow();

      process.env.DATABASE_URL = originalUrl;
    });

    it("safely aborts when DATABASE_URL does not point to test schema", async () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/mydb?schema=public";

      await expect(clearDatabase()).resolves.not.toThrow();

      process.env.DATABASE_URL = originalUrl;
    });
  });
});
