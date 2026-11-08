import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * NON-demo build, no backend configured. Two kinds of check, kept apart:
 *  A. REAL behaviour with no interception: Stage 03 intelligence endpoints need a user session the web app does not have, so they say "sign-in required"; the proxy reports "not connected".
 *  B. CONTROLLED API simulation (page.route on the read-only proxy): empty, error, stale and malformed answers. These simulate the backend's HTTP answers only; no session, token or backend security is faked.
 */
const proxy = "**/api/twins/**";
const noDemo = async (page: Page) => { await expect(page.getByText("DEMO / FIXTURE data")).toHaveCount(0); };
const ready = async (page: Page) => { await page.waitForLoadState("networkidle"); await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15_000 }); };
const chan = { id: "cccccccc", channel: "***2544", name: "Channel A", messages: 9, revisions: 0, claims: { claim: 8, ambiguous: 0, unsupported: 1 }, firstMessageAt: "2026-11-01T05:00:00Z", lastMessageAt: "2026-11-08T05:00:00Z", lastMessageAgeSeconds: 60 };

test.describe("A. real behaviour (no interception)", () => {
  for (const [path, heading] of [["/research/channel-strategy", "Channel Strategy Intelligence"], ["/research/playbooks", "Strategy Playbooks"]] as const) {
    test(`${path}: says sign-in is required and shows no data and no fixture`, async ({ page }) => {
      await page.goto(path); await ready(page);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      await expect(page.getByText(/sign-in required/i).first()).toBeVisible();
      await noDemo(page);
      await expect(page.getByText(/Breakout continuation|\*\*\*2544/)).toHaveCount(0);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    });
  }
  test("/telegram/intake: the pipeline card says sign-in required while the proxy-backed cards say the backend is not connected", async ({ page }) => {
    await page.goto("/telegram/intake"); await ready(page);
    await expect(page.getByText(/candidate pipeline: sign-in required/i)).toBeVisible();
    await expect(page.getByText(/not connected to a backend/i).first()).toBeVisible();
    await noDemo(page);
  });
  test("/telegram/channels: not-connected is an alert, not an empty list", async ({ page }) => {
    await page.goto("/telegram/channels"); await ready(page);
    await expect(page.getByRole("alert").filter({ hasText: /not connected to a backend/i })).toBeVisible();
    await noDemo(page);
  });
  test("no write, approval, execution or live-trading control is offered", async ({ page }) => {
    for (const p of ["/research/playbooks", "/research/channel-strategy", "/telegram/intake"]) { await page.goto(p); await ready(page); await expect(page.getByRole("button", { name: /approve|execute|place order|go live|activate|submit/i })).toHaveCount(0); }
  });
});

test.describe("B. controlled API answers (page.route on the read-only proxy)", () => {
  test("empty: a 200 with no channels is an empty state, not an error", async ({ page }) => {
    await page.route(proxy, (r) => r.fulfill({ json: { channels: [] } }));
    await page.goto("/telegram/channels"); await ready(page);
    await expect(page.getByText(/No channel has sent a message/i).first()).toBeVisible();
  });
  test("ready: real-shaped data renders and carries no DEMO label", async ({ page }) => {
    await page.route(proxy, (r) => r.fulfill({ json: { channels: [chan] } }));
    await page.goto("/telegram/channels"); await ready(page);
    await expect(page.getByText("***2544").first()).toBeVisible(); await noDemo(page);
  });
  for (const [status, text] of [[401, /refused/i], [403, /permission/i], [404, /no such resource/i], [500, /./]] as const) {
    test(`HTTP ${status} is a named error, never an empty list`, async ({ page }) => {
      await page.route(proxy, (r) => r.fulfill({ status, json: { error: "x" } }));
      await page.goto("/telegram/channels"); await ready(page);
      await expect(page.getByRole("alert").filter({ hasText: text }).first()).toBeVisible();
      await expect(page.getByText("***2544")).toHaveCount(0);
    });
  }
  test("a malformed answer is rejected, not rendered", async ({ page }) => {
    await page.route(proxy, (r) => r.fulfill({ json: { unexpected: true } }));
    await page.goto("/telegram/channels"); await page.waitForLoadState("networkidle");
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 20_000 });
  });
  test("network failure is retryable", async ({ page }) => {
    await page.route(proxy, (r) => r.abort());
    await page.goto("/telegram/channels");
    await expect(page.getByRole("button", { name: /retry/i }).first()).toBeVisible({ timeout: 30_000 });
  });
  test("stale: data already loaded stays visible, with a warning, when the next refresh fails", async ({ page }) => {
    let ok = true;
    await page.route(proxy, (r) => (ok ? r.fulfill({ json: { channels: [chan] } }) : r.fulfill({ status: 500, json: { error: "x" } })));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/telegram/channels"); await ready(page); await expect(page.getByText("***2544").first()).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "Signal History" }).first().click(); await expect(page).toHaveURL(/history/);
    ok = false;
    await page.getByRole("navigation").getByRole("link", { name: "Telegram Channels" }).first().click();
    await expect(page.getByText("Showing older data")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("***2544").first()).toBeVisible();
  });
});

test.describe("C. dialog and drawer behaviour (mobile navigation)", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("opens as a labelled modal dialog, traps Tab, closes on Escape and returns focus to the opener", async ({ page }) => {
    await page.goto("/telegram/channels"); await ready(page);
    const opener = page.getByRole("button", { name: "Open navigation" });
    await opener.focus(); await page.keyboard.press("Enter");
    const dlg = page.getByRole("dialog", { name: "Navigation" }); await expect(dlg).toBeVisible();
    await expect(dlg).toHaveAttribute("aria-modal", "true");
    for (let i = 0; i < 80; i++) { await page.keyboard.press("Tab"); expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `focus left the dialog on Tab ${i + 1}`).toBe(true); }
    for (let i = 0; i < 80; i++) { await page.keyboard.press("Shift+Tab"); expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true); }
    await page.keyboard.press("Escape"); await expect(dlg).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
  test("choosing a destination closes the drawer and navigates", async ({ page }) => {
    await page.goto("/telegram/channels"); await ready(page);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog", { name: "Navigation" }).getByRole("link", { name: "Strategy Playbooks" }).click();
    await expect(page).toHaveURL(/playbooks/); await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
