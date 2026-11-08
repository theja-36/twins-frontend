import { defineConfig } from "@playwright/test";

/** Visual + accessibility gate for the Stage 03 screens. Runs against a DEMO production build (fixtures, no backend). Uses the installed Chrome (`channel: "chrome"`) so no browser download is needed locally; CI would use `npx playwright install chromium`. */
export default defineConfig({
  testDir: "e2e", timeout: 60_000, fullyParallel: true, reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3111", channel: process.env.CI ? undefined : "chrome" },
  webServer: { command: "NEXT_PUBLIC_TWINS_DEMO=1 npx next build && NEXT_PUBLIC_TWINS_DEMO=1 npx next start -p 3111", url: "http://127.0.0.1:3111", reuseExistingServer: true, timeout: 240_000 },
});
