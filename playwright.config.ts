import { defineConfig } from "@playwright/test";

/**
 * Visual + accessibility gate for the Stage 03 screens. Runs against a DEMO production build (fixtures, no backend, no secrets).
 * Locally it uses the installed Chrome (`channel: "chrome"`); in CI it uses the Chromium installed by `npx playwright install --with-deps chromium`, and a missing browser FAILS the job (nothing is skipped).
 * No retries: a flaky test must be fixed, not retried into green.
 */
const CI = !!process.env.CI;
export default defineConfig({
  testDir: "e2e", timeout: 60_000, fullyParallel: true, forbidOnly: CI, retries: 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: "http://127.0.0.1:3111", channel: CI ? undefined : "chrome", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "NEXT_PUBLIC_TWINS_DEMO=1 npx next build && NEXT_PUBLIC_TWINS_DEMO=1 npx next start -p 3111", url: "http://127.0.0.1:3111", reuseExistingServer: !CI, timeout: 240_000 },
});
