import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        "scripts/**",
        "dist/**",
        "packages/**",
        "src/__fixtures__/**",
        "src/index.ts",
        "src/index.test.ts",
      ],
    },
  },
});
