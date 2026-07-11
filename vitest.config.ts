import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests run in Node against pure modules (no DB, no Next runtime) so they
// stay fast and CI-friendly. Add integration tests separately if a test DB exists.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    // fileURLToPath is cross-platform; `.pathname` yields a bad "/C:/…" path on Windows.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
