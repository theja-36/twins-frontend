import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CLAIM = "00000000-0000-4000-8000-000000000051";
const SCREENS = [
  { name: "Telegram channels", path: "/telegram/channels", text: "Telegram Channels" },
  { name: "Claims and revisions", path: "/telegram/history", text: "Signal History" },
  { name: "Candidate pipeline and status", path: "/telegram/intake", text: "Signal Intake" },
  { name: "Historical matches", path: `/telegram/signals/${CLAIM}`, text: "Signal Details" },
  { name: "Channel performance", path: "/research/channel-strategy", text: "Channel Strategy Intelligence" },
  { name: "Playbooks and versions", path: "/research/playbooks", text: "Strategy Playbooks" },
];
const VIEWPORTS = [{ n: "desktop", w: 1280, h: 800 }, { n: "tablet", w: 768, h: 1024 }, { n: "mobile", w: 390, h: 844 }];

async function settle(page: Page) { await page.waitForLoadState("networkidle"); await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 10_000 }).catch(() => undefined); }

for (const v of VIEWPORTS) for (const s of SCREENS) {
  test(`${s.name} @ ${v.n} ${v.w}px: renders, no horizontal overflow, no serious a11y violations`, async ({ page }, info) => {
    await page.setViewportSize({ width: v.w, height: v.h });
    await page.goto(s.path); await settle(page);
    await expect(page.getByRole("heading", { name: s.text, level: 1 })).toBeVisible();
    await expect(page.getByText(/demo/i).first()).toBeVisible(); // fixture data is labelled
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, "page-level horizontal overflow (px)").toBeLessThanOrEqual(0);
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = res.violations.filter((x) => x.impact === "serious" || x.impact === "critical");
    expect(bad.map((x) => `${x.id}: ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), "axe serious/critical").toEqual([]);
    await page.screenshot({ path: info.outputPath(`${s.name.replaceAll(" ", "-")}-${v.n}.png`), fullPage: true });
  });
}

test("no write, approval, execution or live-trading controls on the Stage 03 screens", async ({ page }) => {
  for (const s of SCREENS) {
    await page.goto(s.path); await settle(page);
    await expect(page.getByRole("button", { name: /approve|execute|place order|go live|activate|submit/i })).toHaveCount(0);
  }
});

test("keyboard: tab reaches interactive controls with a visible focus indicator", async ({ page }) => {
  await page.goto("/research/playbooks"); await settle(page);
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  const f = await page.evaluate(() => { const e = document.activeElement as HTMLElement | null; if (!e || e === document.body) return null; const c = getComputedStyle(e); return { tag: e.tagName, outline: c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0, shadow: c.boxShadow !== "none" }; });
  expect(f, "something is focused").not.toBeNull();
  expect(f!.outline || f!.shadow, "focus is visible").toBe(true);
});

test("mobile touch targets of primary navigation are at least 24px (WCAG 2.2 AA minimum)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/telegram/intake"); await settle(page);
  const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main a[href],main button, header button")].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent ?? "").trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((r) => r.w > 1 && (r.w < 24 || r.h < 24)));
  expect(small).toEqual([]);
});
