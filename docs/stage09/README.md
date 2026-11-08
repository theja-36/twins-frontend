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
