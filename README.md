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

### Connecting to Live API (When Ready)
Create a `.env.local` file:
```env
NEXT_PUBLIC_TWINS_API_URL=https://your-twins-backend-api.internal
```
The client in `src/services/api.ts` will automatically route calls to your live backend.
