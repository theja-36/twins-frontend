# Stage 09: Frontend & UX (handoff)

## Architecture
- Next.js 15 App Router, strict TS. `src/ds/*` design system (tokens in `globals.css`, dark-first, `html.light` variant; primitives, states, table, charts, overlay, shell). `src/api/*` typed boundary. `src/lib/fmt.ts` decimal-safe formatting (BigInt rounding, no float authority).
- **One data path**: `useEndpoint(def)` (`src/api/query.ts`) -> eight states (loading, ready, empty, stale, error, denied, unavailable, partial via per-panel `Data`). `src/api/registry.ts` declares every endpoint as `LEGACY_READ` (real GET route, via the GET-only allow-listed proxy), `CONTRACT_ONLY` (backend contract/stores exist, no web route) or `NEEDS_SESSION` (owner-scoped; the shared bearer token is not a user identity, so LIVE shows "sign-in required").
- DEMO (`NEXT_PUBLIC_TWINS_DEMO=1`): labelled invented fixtures (`src/api/fixtures`), dynamically imported only behind that flag; `npm run check:bundle` proves a normal build contains none.
- Analytics catalogue snapshot `src/api/contracts/analytics.endpoints.json` mirrors backend `packages/outcomes/src/contracts.ts` (backend HEAD 8437627).

## What is real vs not
Real today (LIVE): health, market snapshot/sources, telegram channels/claims, channel news, intake, agents status, notifications, system config, legacy risk decisions, paper status/summary/positions/outcomes/readiness. Everything from Stages 04-08 (opportunities, research, decisions v2, risk, capital, simulations, approvals, orders/fills/positions v2, analytics, broker, admin) has **no web route**: LIVE shows the unavailable/denied state naming the missing backend piece; only DEMO shows data.

## Safety rules enforced (and tested in `tests/routes.test.ts`)
No write calls; no approve/execute/enable-live controls (Approval Centre read-only, Live Controls has no toggle, Simulator never computes); login form inert; broker page has no input; outcome/workflow/risk are separate badges; fixture analytics labelled NOT_VALIDATED_FIXTURE and validated/fixture sets never blended; agent data labelled association not accuracy; unexecuted decisions labelled estimates; missing/stale price shown as warning.

## Gaps and carry-overs
Stage 01 auth/sessions/permissions (all NEEDS_SESSION screens); backend GET routes for Stages 04-08 (+ an authorised approval contract) to make those screens LIVE; G-13, G-15, G-16, G-19..G-21, G-23..G-33 are backend gaps unchanged by this stage. Mock panels audited: the old static regime/calendar/news/broker panels were removed; the economic-calendar absence is stated, not substituted. Bot link repaired: Approval Centre shows it only if `NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL` is exactly `https://t.me/<bot>`, else says it is not configured. Not done: a11y audit with a screen reader / axe, Lighthouse, e2e workflow tests, per-page console sweep, real-backend run, keyboard-trap test of overlays beyond unit-level code review. No frontend CI evidence: branch not pushed.

## Accessibility checklist (implemented, not audited)
Skip link; landmarks; aria-current nav; tabs with arrow keys; focus-trapped dialogs/drawers; badges carry text + symbol (never colour only); tables have captions, `aria-sort`; charts have text summary + data table; reduced-motion honoured.

## Change log
Classic pages and Studio prototype replaced (routes redirected in `next.config.mjs`); reused `src/lib/*` helpers and the proxy unchanged.

Next: Stage 10 External Integrations.

## Update 2026-11-09: web login and sessions (G-42, owner-approved) and Stage 03 reads
**Supersedes** the statements above that "login is inert", "no write calls" and "NEEDS_SESSION always shows denied".
- **No parallel authentication.** The web app relays to the backend's existing account API: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (routes `src/app/api/auth/{login,logout,me}`). The opaque backend session token is kept only in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` over HTTPS) whose lifetime is the backend's expiry; page script and the login response never contain it.
- **CSRF:** login and logout need a same-origin request AND a matching double-submit token (`twins_csrf` cookie = `x-twins-csrf` header). `/api/auth/me` issues the token.
- **Reads:** `/api/session/*` is a GET-only, allow-listed relay of the Stage 03 intelligence reads under the user's own cookie token (the shared service key is never used; a client-supplied Authorization header is ignored). A backend 401 (expired or revoked) clears the cookie and the page falls back to "sign in".
- **Isolation:** all session-scoped answers are dropped whenever the signed-in user changes (login, logout, session end); responses are `no-store`. Sign out revokes the session at the backend.
- **UI:** working `/login` (accessible, keyboard operable, `next` limited to same-site paths); header shows the user and Sign out in live mode; denied screens link to sign in. The demo build has no accounts.
- **Only write paths:** the login and logout relays, to `/auth/login` and `/auth/logout` (pinned by `tests/routes.test.ts`). Still no approve, execute or live control.
- **Evidence (local; CI pending for the introducing commit):** 79 unit tests (`tests/session.test.ts` for token, cookie, CSRF and allow-list rules); 50 Playwright tests in three projects (demo 21, live 16, session 13); the session project runs against a TEST-ONLY stand-in for the backend's account routes (`e2e/stubBackend.mjs`), covering cookie flags, token never in page/storage, CSRF refusal, logout with backend revocation, revoked and expired sessions, two users on one browser, two browsers at once, relay limits and sign-in page accessibility.
- **Not proven:** an end-to-end run against the real backend (the backend's own session rules are proven by its Stage 01 PostgreSQL integration tests); production HTTPS cookie behaviour (set `Secure` via HTTPS or `x-forwarded-proto`); password-reset and registration screens (not requested); real-user data was never used.
