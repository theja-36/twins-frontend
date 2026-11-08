# Stage 09 pre-push QA report

Base: `bb1019f` (not rewritten). QA fixes are in a separate commit on top. Branch `feat/stage09-frontend`. Not pushed.

## Method and limits (read first)
- Tools: Chrome (Claude-in-Chrome) against `next build` + `next start` (DEMO build for data screens, normal build for LIVE-unconfigured), axe-core 4.14.0 (copied from a local node_modules into `public/` temporarily, removed before commit), same-origin iframes at 1280 / 768 / 390 px, scripted keyboard and click workflows.
- Not done: screen reader (VoiceOver/NVDA) testing; real touch devices; Lighthouse; Firefox/Safari; a real backend (no backend was available, so no real data was ever rendered); axe does not cover everything (cognitive, reading order, many contrast cases on images/gradients). Pixel-level visual review was by eye on screenshots, no visual-regression tooling.

## 1. Visual inspection (30/30 screens now seen by eye)
Earlier 17 plus these 13 this round: Signal Details (6), Signal History (7), Evidence Explorer (8), Agent Intelligence (10), Channel Strategy (11), Playbooks (12), Capital (17), Orders & Fills (22), Open Positions (23), Notifications (27), User Settings (28), Broker Settings (29), Administration (30). 390 px: Decision Centre and its navigation drawer seen; 768 px: P&L seen. Defects found: stray vertical scrollbar on every tab strip (fixed); "Live guard: passes" label ambiguous (reworded "would permit live"). Minor, left as is: timeline timestamps use a longer locale format than tables.

## 2. Console sweep (30 routes, production DEMO build, then LIVE-unconfigured)
- DEMO: 0 errors, 0 warnings, 0 hydration warnings on all 30 routes. (An earlier `/execution/paper` crash on a missing optional field was found in the first QA pass and fixed.)
- LIVE (no backend): pages render denied / unavailable / error states; the browser tool recorded no console errors on the three routes read. The expected 503 `backend_not_configured` responses from the proxy are not application defects.
- One-off noise discarded: a hydration/ChunkLoad error that appeared only because two `next dev` servers shared one `.next` directory (test-harness artifact); not reproducible on production builds.

## 3. Accessibility (axe, after fixes)
| Set | Result |
|---|---|
| Dark, 1280 px, 30 routes | 0 violations |
| Light, 1280 px, 30 routes | 0 violations |
| Dark, 768 px, 30 routes | 0 violations |
| Dark, 390 px, 30 routes (final build) | 0 violations |
| LIVE-unconfigured, 1280 px, 30 routes | found 2 issues (below), fixed; the fixed page set was re-run in DEMO only, LIVE not re-run |
Found and fixed: colour-contrast (dark `fg-faint` 4.1:1, light semantic colours 3.4-4.2:1) via token changes; heading-order (state titles h3 -> h2); scrollable table regions not keyboard-focusable (now `role=region` + `tabIndex=0`); icon-only search button had no name on mobile; detail pages had no h1 when denied. Manual: dialog and drawer trap focus, close on Esc, return focus to the opener (palette, opportunity drawer, nav drawer checked); tab lists support arrow keys; skip link present; charts have a text summary and data table; badges carry text + symbol. Not tested: screen-reader announcement of status banners (banners use role/aria-live where `live` is set but this was not heard).

## 4. Responsive (1280 / 768 / 390)
No horizontal page scroll on any of 30 routes at 1280, 768 and 390 (one defect found and fixed earlier: `/simulator` at 390). Sidebar becomes a drawer below `lg`. Tables scroll inside their own region. Touch targets: header icon buttons are ~36 px (above the WCAG 2.2 AA 24 px minimum, below the 44 px AAA guideline); not enlarged.

## 5. Workflows (production DEMO build, scripted)
27/27 sidebar links navigate client-side to the right page with an h1; signal list -> detail; opportunity row -> drawer (focus inside, Esc closes); decision list -> detail -> all five tabs render -> Size tab -> simulator link; outcome filter reduces 6 -> 1 rows; palette opens with keyboard. 0 trade-action buttons (approve/reject/execute/enable) found on decision detail. LIVE: owner-scoped screens show "sign-in required", contract-only screens "not available yet" with the missing dependency, legacy screens "could not load" (backend not configured). No approval or execution success is simulated anywhere.

## 6. Build, tests, security
`tsc` clean; 70 unit tests pass; `next build` ok (31 pages); `check:bundle` ok (no fixture strings or key material in `.next/static`); the normal build contains no `__axe` and no `TWINS_API_KEY`; no `.env`, key or local-path files are tracked (only `.env.example` with empty placeholders); `public/` is absent.

## Known defects / limitations
- Frontend CI has never run (branch not pushed).
- LIVE sweep found the two issues above after which only DEMO was re-axed.
- Everything in `docs/stage09/README.md` "Gaps and carry-overs" still applies (Stage 01 sessions; no web routes for Stage 04-08 data).

## Post-push CI verification
- Pushed `ef1f3b2` to `origin/feat/stage09-frontend`. That push started **no** workflow: `.github/workflows/ci.yml` triggered only on pull requests and pushes to `main`. No run existed for the branch.
- Before changing anything, the workflow's exact steps were run locally: `tsc --noEmit` OK; `npm test` 70 passed; `next build` with the CI sentinel token OK; sentinel token absent from `.next/static`; `check:bundle` OK.
- Commit `bc2d057` added `'feat/**'` to the push trigger (no step added, removed or weakened). Run **42502464681** (`ci`, job "build (type-check, lint, production build)") on `bc2d057`: **success**. Steps: checkout, setup-node, `npm ci`, `npx tsc --noEmit`, unit tests, production build with sentinel token, token-not-in-client-bundle check: all success. Only annotations: Node 20 action deprecation and an `ubuntu-latest` migration notice (not failures).
- Note: the job title says "lint" but the workflow has no lint step, and CI does not run `check:bundle` (fixture exclusion) or any axe/browser checks; those were run locally only.

## CI hardening: bundle check in CI
`.github/workflows/ci.yml` now ends with a step `npm run check:bundle` (runs `node scripts/check-bundle.mjs` against the sentinel-token production build's `.next/static`; fails on legacy fixture markers, the two contract-fixture markers `Paper account (demo)` / `Fixture summary for the`, or `TWINS_API_KEY=`). Existing steps (npm ci, tsc, 70 unit tests, production build with sentinel token, token-value-absent grep) are unchanged and in the same order. The script's stale comment was corrected and the two contract-fixture markers were added to its list. Local evidence: negative control (a build with `NEXT_PUBLIC_TWINS_DEMO=1`) makes the script print "bundle check FAILED" with fixture hits; the normal CI-style build passes ("bundle check ok").
