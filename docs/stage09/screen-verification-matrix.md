# Screen verification matrix

How verified: `next dev` with `NEXT_PUBLIC_TWINS_DEMO=1` opened in Chrome. All 30 routes were loaded (same-origin frames, 1280px and 390px) and checked for: rendered h1/content, no application crash, no horizontal page scroll. (Updated in the pre-push QA: all 30 screens have since been viewed by eye; see `pre-push-qa-report.md`.) One defect found and fixed this way: `/execution/paper` crashed on a missing optional field, `/simulator` overflowed at 390px. Console errors were read for the crash page only; a full per-page console sweep was NOT performed. A LIVE (no backend configured) server was opened for three screens only. Real-backend data was never shown (no backend was available). Screens needing a 12-specialist backend or real sessions are DEMO-only.

| # | Screen | DEMO: loaded, no crash | DEMO: 1280px no h-scroll | 390px no h-scroll | Screenshot viewed | LIVE-unconfigured state viewed |
|---|---|---|---|---|---|---|
| 1 | Sign in | yes | yes | yes | yes | no |
| 2 | Dashboard | yes | yes | yes | yes | no |
| 3 | Market Overview | yes | yes | yes | yes | yes |
| 4 | Telegram Channels | yes | yes | yes | yes | no |
| 5 | Signal Intake | yes | yes | yes | yes | no |
| 6 | Signal Details | yes | yes | yes | yes (QA round 2) | no |
| 7 | Signal History | yes | yes | yes | yes (QA round 2) | no |
| 8 | Evidence Explorer | yes | yes | yes | yes (QA round 2) | no |
| 9 | Research Workspace | yes | yes | yes | yes | no |
| 10 | Agent Intelligence | yes | yes | yes | yes (QA round 2) | no |
| 11 | Channel Strategy Intelligence | yes | yes | yes | yes (QA round 2) | no |
| 12 | Strategy Playbooks | yes | yes | yes | yes (QA round 2) | no |
| 13 | Independent Opportunities | yes | yes | yes | yes | yes |
| 14 | Decision Centre | yes | yes | yes | yes | yes |
| 15 | Decision Detail | yes | yes | yes | yes | no |
| 16 | Risk Dashboard | yes | yes | yes | yes | no |
| 17 | Capital Management | yes | yes | yes | yes (QA round 2) | no |
| 18 | What-if Simulator | yes | yes | yes | yes | no |
| 19 | Approval Centre | yes | yes | yes | yes | no |
| 20 | Paper Trading | yes | yes | yes | yes | no |
| 21 | Live Execution Controls | yes | yes | yes | yes | no |
| 22 | Orders & Fills | yes | yes | yes | yes (QA round 2) | no |
| 23 | Open Positions | yes | yes | yes | yes (QA round 2) | no |
| 24 | Trade Monitoring | yes | yes | yes | yes | no |
| 25 | P&L & Analytics | yes | yes | yes | yes | no |
| 26 | Learning & Performance | yes | yes | yes | yes | no |
| 27 | Notifications | yes | yes | yes | yes (QA round 2) | no |
| 28 | User Settings | yes | yes | yes | yes (QA round 2) | no |
| 29 | Broker Settings | yes | yes | yes | yes (QA round 2) | no |
| 30 | Administration & Audit | yes | yes | yes | yes (QA round 2) | no |
