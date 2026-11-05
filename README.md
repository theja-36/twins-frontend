# Twins — Personal Trading Intelligence Frontend

Frontend user interface for **Twins**, a personal trading intelligence system built with Next.js, React, Tailwind CSS, and Lucide icons.

## Architecture & guarantees
- **Read-only.** Only GET is proxied; there is no approve, reject, order or switch action in this UI. Approving a trade is done in Telegram.
- **Real data only.** There is no sample data anywhere. If the backend is missing or unreachable, one banner says so (with the reason and a Retry button) and pages show nothing instead of invented numbers; anything still on screen from before is marked as possibly stale.
- **The API token never reaches the browser.** A server-side proxy holds it.
- Paper data is labelled paper; live trading is locked at the backend.

## Getting Started

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

### Running it locally against staging (read-only)
```bash
ssh -L 4400:127.0.0.1:4110 hostinger-vps        # leave this running in one terminal
# in the frontend folder; the token is entered without echo and kept only in this shell:
read -rs TWINS_API_KEY && export TWINS_API_KEY TWINS_API_URL=http://127.0.0.1:4400
npm run dev                                       # http://localhost:3000
```

## Views
| Route | Shows | Backend (GET only) |
|---|---|---|
| `/` Overview | safety posture, what is waiting for you, signals today, intake, system health, paper strip (with the enable-readiness chip), latest signals and activity | `/system/config`, `/health/status`, `/risk/decisions`, `/risk/approvals`, `/paper/*`, `/notifications` |
| `/signals` | every parsed signal after the safety gates | `/risk/decisions` |
| `/approvals` | approval cards waiting for a human (read-only: approve in Telegram) | `/risk/decisions`, `/risk/approvals` |
| `/positions` | simulated positions with stop/entry/target ladder, live P&L and R | `/paper/positions` |
| `/pnl` | P&L, win rate, expectancy, profit factor, drawdown, equity curve, small-sample warning | `/paper/summary`, `/paper/outcomes`, `/paper/outcomes/stats` |
| `/history` | merged log of signals, approvals and closed trades | `/risk/decisions`, `/risk/approvals`, `/paper/outcomes` |
| `/intake` | Telegram intake counts, in-flight and dead-lettered items, recent messages (no text) | `/intake/status` |
| `/market` | index prices, the Kite snapshot generation (per-file age), the provider data files | `/market/snapshot` |
| `/agents` | the twelve research agents, engine mode, recent recorded runs | `/agents/status` |
| `/notifications` (+ bell) | audited system events | `/notifications` |
| `/settings` | the paper-trading enable checklist, safety posture, paper config, agent engine, risk limits | `/paper/readiness`, `/system/config` |

Removed because they only showed invented data: Decision Lab, Activity & Audit, Snapshots (their routes redirect to Approvals, Notifications and Market data).

Dark mode: the moon/sun button in the header (saved in the browser; `?theme=dark` forces it for a link).

## Screenshots (`docs/screenshots/`)
All of them were taken against a local API with the project's synthetic test data and a synthetic snapshot: light, dark, phone width, and the **no-backend** state. Screenshots of the real staging data are deliberately NOT stored in this repository (it is public for the moment); the end-to-end run against staging was checked by hand.
