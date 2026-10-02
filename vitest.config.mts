import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    projects: [
      { extends: true, test: { name: "convex", include: ["convex/**/*.test.ts"], environment: "edge-runtime" } },
      { extends: true, test: { name: "server", include: ["tests/**/*.test.ts"], environment: "node" } },
      { extends: true, test: { name: "ui", include: ["tests/**/*.test.tsx"], environment: "jsdom" } },
    ],
  },
});
