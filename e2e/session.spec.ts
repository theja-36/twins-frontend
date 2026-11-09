import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Login relay (G-42), against a TEST-ONLY backend stand-in (e2e/stubBackend.mjs). Proves the WEB APP's behaviour: cookie flags, CSRF, logout, expiry, revocation, per-user isolation and the read relay's limits.
 * It does not prove the backend's own session rules (those are the backend's PostgreSQL integration tests) and it is not an end-to-end test against a real backend.
 */
const STUB = "http://127.0.0.1:4199";
const ALICE = { email: "alice@example.test", password: "alice-pass-1234" }, BOB = { email: "bob@example.test", password: "bob-pass-12345" };
const reset = async (r: APIRequestContext) => { await r.post(`${STUB}/__reset`); };
const kill = async (r: APIRequestContext, email: string, how: "revoke" | "expire") => { await r.post(`${STUB}/__kill?email=${encodeURIComponent(email)}&how=${how}`); };
async function signIn(page: Page, who: { email: string; password: string }, next = "/research/channel-strategy") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(who.email); await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/\//g, "\\/")));
}
const sessionCookie = async (page: Page) => (await page.context().cookies()).find((c) => c.name === "tws_session");

test.beforeEach(async ({ request }) => { await reset(request); });

test("anonymous: reads say sign-in is required and offer the sign-in link", async ({ page }) => {
  await page.goto("/research/playbooks");
  await expect(page.getByText(/sign-in required/i).first()).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).first().click(); await expect(page).toHaveURL(/\/login/);
});

test("a wrong password is refused with a fixed message and sets no session", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ALICE.email); await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The email or password is not correct." })).toBeVisible();
  expect(await sessionCookie(page)).toBeUndefined();
  await expect(page.getByLabel("Password")).toHaveValue(""); // the password is dropped after an attempt
});

test("signing in sets an HttpOnly SameSite=Strict cookie the page cannot read, shows the user's data, and the token is never in the page or its storage", async ({ page, request }) => {
  let loginBody = "";
  await page.route("**/api/auth/login", async (route) => { const r = await route.fetch(); loginBody = await r.text(); await route.fulfill({ response: r }); });
  await signIn(page, ALICE); expect(loginBody).toContain("expiresAt"); // captured: the answer the page received
  await expect(page.getByText("***alice")).toBeVisible();
  const c = await sessionCookie(page); expect(c).toBeDefined();
  expect(c!.httpOnly).toBe(true); expect(c!.sameSite).toBe("Strict");
  const ttl = c!.expires - Date.now() / 1000; expect(ttl).toBeGreaterThan(7000); expect(ttl).toBeLessThanOrEqual(7200); // the backend's 2 h expiry, not longer
  const seen = await page.evaluate(() => ({ cookie: document.cookie, local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), html: document.documentElement.outerHTML }));
  for (const v of Object.values(seen)) expect(v).not.toContain(c!.value);
  expect(seen.cookie).not.toContain("tws_session");
  expect(loginBody).not.toContain("token"); expect(loginBody).not.toContain(c!.value);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  // what the backend received: the user's own session token, never anything else, on account and intelligence routes
  const log = (await (await request.get(`${STUB}/__log`)).json()) as Array<{ path: string; auth: string | null }>;
  const guarded = log.filter((l) => l.path.startsWith("/intelligence") || l.path === "/auth/me");
  expect(guarded.length).toBeGreaterThan(0); for (const l of guarded) expect(l.auth, l.path).toBe("session");
});

test("CSRF: login and logout refuse a missing token, a wrong token, and a foreign Origin", async ({ page, request }) => {
  await page.goto("/login"); await page.evaluate(() => fetch("/api/auth/me")); // issues the CSRF cookie
  const cookies = await page.context().cookies(), csrf = cookies.find((c) => c.name === "twins_csrf")!.value;
  const base = page.url().replace(/\/login.*/, "");
  const post = (url: string, headers: Record<string, string>) => request.post(base + url, { data: { email: ALICE.email, password: ALICE.password }, headers });
  expect((await post("/api/auth/login", {})).status()).toBe(403);
  expect((await post("/api/auth/login", { "x-twins-csrf": "A".repeat(43) })).status()).toBe(403);
  const ctx = page.context().request;
  expect((await ctx.post(base + "/api/auth/login", { data: ALICE, headers: { "x-twins-csrf": csrf, origin: "https://evil.example" } })).status()).toBe(403);
  expect((await ctx.post(base + "/api/auth/logout", { headers: { origin: "https://evil.example", "x-twins-csrf": csrf } })).status()).toBe(403);
  expect((await ctx.post(base + "/api/auth/logout", {})).status()).toBe(403);
  expect(await sessionCookie(page)).toBeUndefined();
});

test("sign out revokes the session at the backend, clears the cookie and returns reads to sign-in required", async ({ page, request }) => {
  await signIn(page, ALICE); const old = (await sessionCookie(page))!.value;
  await page.getByRole("button", { name: "Sign out" }).click(); await expect(page).toHaveURL(/\/login/);
  expect(await sessionCookie(page)).toBeUndefined();
  await page.goto("/research/playbooks"); await expect(page.getByText(/sign-in required/i).first()).toBeVisible();
  const back = await request.get(`${STUB}/auth/me`, { headers: { authorization: `Bearer ${old}` } });
  expect(back.status()).toBe(401); // the old token is dead at the backend, not just forgotten by the browser
});

for (const how of ["revoke", "expire"] as const) {
  test(`a session that was ${how}d behind the page's back ends cleanly: the next read says sign-in required and the cookie is cleared`, async ({ page, request }) => {
    await signIn(page, ALICE); await expect(page.getByText("***alice")).toBeVisible();
    await kill(request, ALICE.email, how);
    await page.goto("/research/channel-strategy");
    await expect(page.getByText(/sign-in required/i).first()).toBeVisible();
    await expect(page.getByText("***alice")).toHaveCount(0);
    expect(await sessionCookie(page)).toBeUndefined();
  });
}

test("per-user isolation: the next user on the same browser never sees the previous user's data", async ({ page }) => {
  await signIn(page, ALICE); await expect(page.getByText("***alice")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click(); await expect(page).toHaveURL(/\/login/);
  await signIn(page, BOB);
  await expect(page.getByText("***bob")).toBeVisible();
  await expect(page.getByText("***alice")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.outerHTML)).not.toContain("alice");
});

test("two browsers at once keep two separate sessions", async ({ browser }) => {
  const a = await browser.newContext(), b = await browser.newContext(), pa = await a.newPage(), pb = await b.newPage();
  const base = "http://127.0.0.1:3112";
  for (const [p, who] of [[pa, ALICE], [pb, BOB]] as const) { await p.goto(`${base}/login?next=%2Fresearch%2Fchannel-strategy`); await p.getByLabel("Email").fill(who.email); await p.getByLabel("Password").fill(who.password); await p.getByRole("button", { name: "Sign in" }).click(); }
  await expect(pa.getByText("***alice")).toBeVisible(); await expect(pb.getByText("***bob")).toBeVisible();
  await expect(pa.getByText("***bob")).toHaveCount(0); await expect(pb.getByText("***alice")).toHaveCount(0);
  await a.close(); await b.close();
});

test("the read relay is GET-only, allow-listed and needs the cookie", async ({ page }) => {
  await page.goto("/login"); const ctx = page.context().request, base = "http://127.0.0.1:3112";
  expect((await ctx.get(`${base}/api/session/intelligence/channels`)).status()).toBe(401);
  await signIn(page, ALICE);
  expect((await ctx.get(`${base}/api/session/intelligence/channels`)).status()).toBe(200);
  expect((await ctx.get(`${base}/api/session/auth/me`)).status()).toBe(404);
  expect((await ctx.get(`${base}/api/session/intelligence/channels/not-a-uuid`)).status()).toBe(404);
  expect((await ctx.post(`${base}/api/session/intelligence/channels`)).status()).toBe(405);
  expect((await ctx.get(`${base}/api/session/intelligence/channels`, { headers: { authorization: "Bearer tws_attacker_supplied_token_value_123456" } })).status()).toBe(200); // the header is ignored; only the cookie counts
});

test("the sign-in page is keyboard operable and has no serious accessibility violations at 390px and 1280px", async ({ page }) => {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: 800 }); await page.goto("/login");
    await page.getByLabel("Email").focus(); await page.keyboard.type(ALICE.email); await page.keyboard.press("Tab"); await page.keyboard.type(ALICE.password);
    await expect(page.getByLabel("Password")).toBeFocused();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  }
  await page.keyboard.press("Enter"); await expect(page).toHaveURL("http://127.0.0.1:3112/");
});

test("the next parameter cannot send the user to another site", async ({ page }) => {
  await page.goto("/login?next=" + encodeURIComponent("//evil.example/x")); await page.getByLabel("Email").fill(ALICE.email); await page.getByLabel("Password").fill(ALICE.password);
  await page.getByRole("button", { name: "Sign in" }).click(); await expect(page).toHaveURL("http://127.0.0.1:3112/");
});
