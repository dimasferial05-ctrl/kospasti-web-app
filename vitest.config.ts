import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./test.db",
    },
    globalSetup: ["test/global-setup.ts"],
  },
});
