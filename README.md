# Twins — Personal Trading Intelligence Frontend

Frontend user interface for **Twins**, a personal trading intelligence system built with Next.js, React, Tailwind CSS, and Lucide icons.

## Architecture & Guarantees
- **Audit/Security-First**: Enforces a strict read-only lock. Live broker execution routing is isolated.
- **Deep Obsidian & Slate Dark Terminal**: High-contrast, low-latency financial terminal aesthetic with glowing telemetry badges and responsive mobile layout.
- **Extensible API Layer**: Pre-built mock & telemetry adapter (`src/services/api.ts`). Switching to live backend endpoints requires setting one environment variable: `NEXT_PUBLIC_TWINS_API_URL`.

---

## Implemented Views

### 1. Dashboard (`/`)
- **System Telemetry & Health**: Status of Telegram ingestion pipeline, Zerodha Kite WebSocket stream, agent engine, isolated execution gateway, and SHA-256 Merkle audit verifier.
- **Real-Time KPIs**: Telegram messages 24h, Kite ticks/sec (1,840 peak, 18ms latency), pending human approvals, cryptographic integrity score (100%).
- **Snapshot Storage & Verification**: Manifest of cold storage snapshots (`.json.gz`), SHA-256 copy-to-clipboard, one-click interactive cryptographic verification.
- **Subsystem Diagnostics Matrix**: Live latency, backlog queue, protocol versions, and channel metrics.

### 2. Decisions & Approvals (`/decisions`)
- **Decision Cards**: Action badges (BUY/SELL/EXIT), Ticker & Exchange, AI Confidence %, Proposed Qty, Est. Price, Stop-Loss, Target, Risk Score (LOW/MEDIUM/HIGH/CRITICAL), Risk flags, and SHA-256 audit hash.
- **Telegram Signal Citation**: Shows the exact monitored channel, timestamp, and message snippet that triggered the agent's evaluation.
- **Safe Sign-off Workflow**: Simulated approval and rejection modal capturing human audit notes and writing to the cryptographic audit trail without triggering broker orders.
- **Agent Execution Trace**: Table of recent agent runs (Sentinel Alpha, Hedge Sentinel, Exhaustion Detector), trigger types, token scans, decisions emitted, and reasoning logs.

### 3. Market Data (`/market`)
- **Zerodha Kite Live Feed**: Subscribed instruments (RELIANCE, HDFCBANK, TCS, INFY, ICICIBANK, NIFTY 50).
- **Live Ticks**: Real-time tick simulator with subtle green/red price flash animations, LTP, point change, % change, volume, and turnover.
- **Level 2 Market Depth**: 5-level Bid and Ask order book with prices, order counts, and cumulative volumes.
- **Candle Telemetry**: 15-minute OHLC bars with volume and trend classification.

### 4. Settings & Configuration (`/settings`)
- **Safe Read-Only Audit**: Clear inspection of operational parameters without write risk.
- **Pipeline Governance**: Monitored Telegram channels, keyword filters, rate limits, and minimum confidence cutoffs.
- **Kite Stream Configuration**: Masked API keys, session tokens, daily expiry reminders, and feed modes.
- **Risk Governance Rules**: Max single position, max portfolio exposure, mandatory stop-loss limits, and circuit breakers.
- **Backend API Adapter**: Instructions on connecting real backend endpoints.

---

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

### Connecting to the live backend (read-only)
The browser never talks to the backend directly. A server-side proxy (`src/app/api/twins/[...path]/route.ts`) forwards **GET requests on an allow-list** (`health`, `risk/decisions`, `risk/approvals`, `paper/*`) and keeps the API token on the server.
```env
# .env.local
NEXT_PUBLIC_TWINS_LIVE=1
TWINS_API_URL=http://127.0.0.1:4000      # server-only
TWINS_API_KEY=...                         # server-only, never NEXT_PUBLIC_
```
If the backend is not configured or unreachable the pages fall back to clearly labelled mock data. Staging's API listens on the VPS loopback only: use an SSH tunnel (`ssh -L 4000:127.0.0.1:4000 hostinger-vps`).

**Safety:** there is no write path. Only GET is proxied; approving or rejecting a trade is done in Telegram (or the operator command), not from this UI; every page labels paper data as paper.

## Trading views (wired to the backend, mock fallback)
| Route | Shows | Backend |
|---|---|---|
| `/signals` | Every parsed signal after the safety gates: levels ladder, size, risk:reward, confidence, trust tier, status | `GET /risk/decisions` |
| `/approvals` | Approval cards waiting for a human, approved cards handed to paper trading, recent approvals | `GET /risk/decisions?status=APPROVED_FOR_REVIEW`, `GET /risk/approvals` |
| `/positions` | Simulated positions with stop/entry/target ladder, live P&L and R, state filters | `GET /paper/positions` |
| `/pnl` | Total/realised/unrealised P&L, win rate, expectancy, profit factor, drawdown, equity curve (R), breakdowns, recent closed trades, small-sample warning | `GET /paper/summary`, `/paper/outcomes`, `/paper/outcomes/stats` |
| `/settings` | Adds a read-only view of the paper-trading configuration | `GET /paper/status` |
| `/` | Adds a paper-trading strip (switch state, open positions, P&L, win rate) | `GET /paper/status`, `/paper/outcomes/stats` |

The header pill turns green ("Live backend (paper only)") when the backend answers. Screenshots: `docs/screenshots/` (desktop `d-*`, phone-width `m-*`).

The earlier demo pages (Telegram Intake, Market Feed, Decision Lab, Snapshots, Activity) are unchanged and still run on mock data.
