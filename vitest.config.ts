import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/__tests__/setup.ts"],
    env: {
      APP_ENCRYPTION_KEY: "dGVzdC1lbmNyeXB0aW9uLWtleS1mb3Itdml0ZXN0LXN1aXRl",
    },
  },
});
