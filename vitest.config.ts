import { defineConfig } from "vitest/config";
// Unit tests live in tests/. The Playwright specs in e2e/ run under `npm run test:e2e`, never under vitest.
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
