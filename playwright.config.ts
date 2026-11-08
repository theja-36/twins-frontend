import { defineConfig } from "@playwright/test";

/**
 * Visual + accessibility gate for the Stage 03 screens, in two builds:
 *  - "demo": a DEMO production build (fixtures, no backend, no secrets) on :3111 — stage03.spec.ts;
 *  - "live": a normal NON-demo build on :3112 (distDir .next-live) with NO backend configured — live.spec.ts: the real sign-in-required and not-connected experiences, plus controlled API
 *    interception (page.route) for error / empty / stale / malformed answers. No session is faked and no backend security is bypassed.
 * Locally it uses the installed Chrome (`channel: "chrome"`); in CI it uses the Chromium installed by `npx playwright install --with-deps chromium`, and a missing browser FAILS the job (nothing is skipped).
 * No retries: a flaky test must be fixed, not retried into green.
 */
const CI = !!process.env.CI;
const channel = CI ? undefined : ("chrome" as const);
export default defineConfig({
  testDir: "e2e", timeout: 60_000, fullyParallel: true, forbidOnly: CI, retries: 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { channel, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "demo", testMatch: "stage03.spec.ts", use: { baseURL: "http://127.0.0.1:3111" } },
    { name: "live", testMatch: "live.spec.ts", use: { baseURL: "http://127.0.0.1:3112" } },
  ],
  webServer: [
    { command: "NEXT_PUBLIC_TWINS_DEMO=1 npx next build && NEXT_PUBLIC_TWINS_DEMO=1 npx next start -p 3111", url: "http://127.0.0.1:3111", reuseExistingServer: !CI, timeout: 240_000 },
    { command: "NEXT_DIST_DIR=.next-live npx next build && NEXT_DIST_DIR=.next-live npx next start -p 3112", url: "http://127.0.0.1:3112", reuseExistingServer: !CI, timeout: 240_000 },
  ],
});
