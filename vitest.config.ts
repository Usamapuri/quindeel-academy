import { defineConfig } from "vitest/config";

// Unit tests run in Node against pure modules (no DB, no Next runtime) so they
// stay fast and CI-friendly. Add integration tests separately if a test DB exists.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": new URL("./", import.meta.url).pathname },
  },
});
