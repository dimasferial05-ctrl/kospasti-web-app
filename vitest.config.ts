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
    testTimeout: 20000,
    setupFiles: ["test/setup-env.ts"],
    globalSetup: ["test/global-setup.ts"],
  },
});
