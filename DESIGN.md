# TWINS frontend design system

Dark-first (the saved choice wins; the toggle in the header switches), calm and high contrast. Read-only: nothing here places, approves or cancels anything.

* **Colours:** base `#0B0E14`, surfaces `#11161F`, borders `#262E3E`; accent electric blue (`royal-500` `#3B82F6`); success green, warning amber, danger red. The existing light utilities are remapped in `globals.css` for dark mode.
* **Type:** Inter for text, Geist Mono for numbers and codes (loaded with `next/font`, no external request at runtime).
* **Motion (Framer Motion, `src/components/motion/`):** `PageTransition`, `Stagger` / `StaggerItem`, `HoverLift`, `CountUp`, `PulseDot`, `DrawIn`, `Drawer`, `Modal`, `Toast`. Every one honours `prefers-reduced-motion`.
* **Controls:** `Toggle` (role=switch, can explain why it is disabled), `Tip` (hover and focus tooltip), `Pill`, `SampleBadge`.
* **Charts (Recharts, `components/trading/charts.tsx`):** `EquityAreaChart`, `ShareBars`. Each has an `aria-label` stating what it shows.
* **Data rules:** real backend data wherever a read route exists. Where none exists yet the panel carries a visible **SAMPLE** badge and invented values (market regime, economic calendar, news). An endpoint an older backend lacks answers 404 and the page shows "not available yet" instead of an error banner (`useOptional`).
* **Approval:** Approve / Reject are disabled everywhere with the reason; approval is made in the Telegram bot. `NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL` (a `https://t.me/<bot>` address) enables the deep link.
* **Tests:** `npm test` runs unit tests for the pure helpers (`src/lib`, number formatting). CI runs type-check, tests, the production build and the token-leak check.
