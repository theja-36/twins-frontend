# Studio coverage matrix (implementation checklist)

Evidence: V = visual check of fixtures (desktop and phone), F = fixture state check, L = live read path run against a local MOCK API (invented data, not a real backend), T = unit test, K = keyboard/focus check in a browser.

## 1 Dashboard

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Available equity / capital | Overview: tile reads 'Not available' | none: no route returns capital | full | unavailable | V,F |
| Paper P&L, day P&L | Overview paper card | GET /paper/summary, /paper/outcomes, /paper/positions | full | available | V,F,L |
| Exposure | Overview paper card | GET /paper/summary | full | available | V,F,L |
| Drawdown | Overview 'Drawdown now' (R, derived from closed trades) | GET /paper/outcomes (derived in browser) | full | available | V,F,L |
| Open paper positions, status (no per-position quote age) | Overview list, state chips; note says the API gives no quote time | GET /paper/positions | full | available | V,F,L |
| Recent decisions and approval status | Overview list + stacked deck preview | GET /risk/decisions, /risk/approvals | full | available | V,F,L |
| Market regime | Overview, SAMPLE badge | none | full | sample | V |
| Source health | Overview widget (status + first reason) | GET /market/sources | full | available | V,F,L |
| Safe quick actions | Go-to links, Refresh data (re-reads existing routes) | none | full | available | V |

## 2 Channels

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Channel cards, checkboxes as view filters only | Channels page; selection kept in the browser (same key as classic app) | GET /telegram/channels | full | available | V,F,L |
| Messages, claims, last-seen | Channel card funnel (messages, claims by kind, last message age) | GET /telegram/channels | full | available | V,F,L |
| Capture / health status, trust badges | Capture-allowed chip, last-message chip, Trust: UNKNOWN | GET /telegram/channels (captureAllowed); no scorecard route | full | unavailable | V,F |
| Selected-channel feed: levels, inferred-premium, blockers | Signal feed table / phone cards + claim sheet | GET /telegram/claims | full | available | V,F,L |
| Messages -> claims -> decisions relationship | Funnel; decisions shown as n/a with the reason (API has no channel attribution) | none for decisions | partial | unavailable | V |
| Result-report toggle | Disabled with reason. Traced: parser v3 classifies reports as no-signal and ingestSignal returns created:false, so none are stored | no stored data | full | unavailable | T,code trace |
| Read-only management, Add Channel | Explanation sheet, disabled button, proposed separate scope | no route (allow-list is a host setting) | full | unavailable | V,F |

## 3 Signals

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Contract, action, entry, stop, targets, expiry | Signals table / phone cards | GET /telegram/claims | full | available | V,F,L |
| Channel, market, side, assessment, time filters | Filter panel; labelled as filtering the loaded records only | API has no such filters | full | available | V,T |
| Claim detail sheet | Sheet: levels, stop quality, blockers, assessment, details | GET /telegram/claims | full | available | V,F |
| Stop-loss quality, inferred-premium marker | Chips from the shared stopQuality helper | GET /telegram/claims | full | available | V,F,L |
| Origin; no system-generated signals | Telegram chip; disabled 'System-generated · not available' | not implemented | full | unavailable | V |
| Link to related decision | Not shown; sheet says the API does not link a claim to a decision | none | absent | unavailable | V |

## 4 Decisions

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Pending / approved / rejected / expired filters | Status chips (deck and list) | GET /risk/decisions | full | available | V,F,L,T |
| Deck + list alternative; swipe, drag, buttons, keyboard | Decisions page | same data | full | available | V,F,L,K |
| Headline and thesis | Sheet: assessment, decided by, halt reason, statements | GET /risk/decisions/:id/decision-card | full | available | V,F |
| Bull / Neutral / Bear bar | Sheet; production arithmetic, unit tested | decision-card agents | full | available | V,F,T |
| Per-agent verdicts and findings | Sheet disclosure | decision-card agents | full | available | V,F |
| Blockers; structured close calls | Sheet table: rule, threshold, value, met, margin | decision-card | full | available | V,F |
| Proposed size, notional, sizing status, trust tier | Card fact + sheet grid | decision summary + card sizing | full | available | V,F |
| Source / data-health pills; approval status | Sheet pills; approval ledger join | decision-card sourceHealth; /risk/approvals | full | available | V,F,T |
| Approve/Reject disabled with reason | Card and sheet | no write route | full | unavailable | V,K |
| Telegram bot link; copy decision id; no deep link | Same rule as the decision page; copy in sheet; text says link opens the bot only | env NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL | full | available | T,K |

## 5 Market

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| NIFTY, BANKNIFTY, SENSEX quotes with price age | Index cards; age of the stored price, no 'live' claim | GET /market/snapshot | full | available | V,F,L |
| Source status and freshness | Source health list | GET /market/sources | full | available | V,F,L |
| Provider files, snapshot generation | Only the 'not visible' state reports generation status; files list not shown | GET /market/snapshot | partial | available | V |
| Regime; economic calendar | SAMPLE badges and wording, no figures | none | full | sample | V |
| Telegram commentary (missing/stale/invalid distinct) | Commentary card with status notes | GET /news/telegram (needs writer) | full | available | V,F,L |
| Marketaux availability | 'Not activated, no request made' | not activated | full | sample | V |

## 6 Portfolio

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Positions with state filters | Table / phone cards | GET /paper/positions | full | available | V,F,L,T |
| P&L and exposure | Paper summary | GET /paper/summary | full | available | V,F,L |
| Exposure by symbol; sector note | Bars; sector breakdown explained as unavailable | derived | full | available | V,F,L |
| Trade history, honest empty state | Closed trades table; empty state mentions paper trading | GET /paper/outcomes | full | available | V,F,L |
| Outcome attribution, 'too thin to read' | Attribution card | GET /paper/outcomes/stats | full | available | V,F |

## 7 Settings

| Item | Where in Studio | Backend | Studio | Backend support | Evidence |
|---|---|---|---|---|---|
| Provider / source health | Data section | GET /market/sources | full | available | V,F,L |
| Read-only safety flags | Safety section | GET /system/config, /health/status | full | available | V,F,L |
| Trading: paper, engine, risk limits, readiness | Trading section | GET /system/config, /paper/readiness | full | available | V,F |
| View-only channel information | Data section | GET /telegram/channels | full | available | V,F |
| Broker states: configured / connected / feed verified / feed running | Four separate columns; no connect or login control; ports are not a connection | no route | full | unavailable | V,F |

Totals: {'full': 45, 'partial': 2, 'absent': 1} over 48 rows.
