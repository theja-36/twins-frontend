# Route inventory and module traceability (generated from `src/ds/shell/nav.ts`)

The registry is the single source: sidebar, breadcrumbs, command palette and `tests/routes.test.ts` all read it.

| # | Screen | Route | Group | Modules | Backend contract (registry keys) | Permission | Component |
|---|---|---|---|---|---|---|---|
| 1 | Sign in | `/login` | (none) | M01 Auth & access | — | `public` | `src/app/login/page.tsx` |
| 2 | Dashboard | `/` | Overview | M01, M05, M12, M14, M15 | systemConfig, marketSnapshot, paperSummary, intake, decisions, aOverview | `mixed` | `src/app/page.tsx` |
| 3 | Market Overview | `/market` | Market Intelligence | M02 Market context | marketSnapshot, marketSources, channelNews | `market:read` | `src/app/market/page.tsx` |
| 4 | Telegram Channels | `/telegram/channels` | Telegram Intelligence | M03 Telegram intake | channels | `telegram:read` | `src/app/telegram/channels/page.tsx` |
| 5 | Signal Intake | `/telegram/intake` | Telegram Intelligence | M03 | claims, intake | `telegram:read` | `src/app/telegram/intake/page.tsx` |
| 6 | Signal Details | `/telegram/signals/[id]` | Telegram Intelligence | M03, M04 Claim assessment | claims | `telegram:read` | `src/app/telegram/signals/[id]/page.tsx` |
| 7 | Signal History | `/telegram/history` | Telegram Intelligence | M03 | claims | `telegram:read` | `src/app/telegram/history/page.tsx` |
| 8 | Evidence Explorer | `/evidence` | Research & Agents | M06 Research | evidence | `research:read` | `src/app/evidence/page.tsx` |
| 9 | Research Workspace | `/research` | Research & Agents | M06 Research | research | `research:read` | `src/app/research/page.tsx` |
| 10 | Agent Intelligence | `/research/agents` | Research & Agents | M07 Specialist agents | agentCards, agentsStatus | `research:read` | `src/app/research/agents/page.tsx` |
| 11 | Channel Strategy Intelligence | `/research/channel-strategy` | Research & Agents | M07, M15 | channelStrategy | `research:read` | `src/app/research/channel-strategy/page.tsx` |
| 12 | Strategy Playbooks | `/research/playbooks` | Research & Agents | M07 | playbooks | `research:read` | `src/app/research/playbooks/page.tsx` |
| 13 | Independent Opportunities | `/opportunities` | Opportunities | M16 Independent opportunity engine | opportunities | `opportunity:read` | `src/app/opportunities/page.tsx` |
| 14 | Decision Centre | `/decisions` | Decisions | M12 Decision engine | decisions | `decision:read` | `src/app/decisions/page.tsx` |
| 15 | Decision Detail | `/decisions/[id]` | Decisions | M12, M09 Stop-loss, M10 Confidence | decisions, simulations | `decision:read` | `src/app/decisions/[id]/page.tsx` |
| 16 | Risk Dashboard | `/risk` | Risk & Capital | M11 Risk control | riskOverview | `risk:read` | `src/app/risk/page.tsx` |
| 17 | Capital Management | `/capital` | Risk & Capital | M08 Capital & sizing | capital | `capital:read` | `src/app/capital/page.tsx` |
| 18 | What-if Simulator | `/simulator` | Risk & Capital | M11, M08 | simulations | `simulation:read` | `src/app/simulator/page.tsx` |
| 19 | Approval Centre | `/approvals` | Decisions | M12, M13 Human approval | approvals | `decision:approve` | `src/app/approvals/page.tsx` |
| 20 | Paper Trading | `/execution/paper` | Execution | M14 Paper execution | paperStatus, paperSummary, paperReadiness | `execution:read` | `src/app/execution/paper/page.tsx` |
| 21 | Live Execution Controls | `/execution/live` | Execution | M14 | executionControls, systemConfig | `execution:read` | `src/app/execution/live/page.tsx` |
| 22 | Orders & Fills | `/execution/orders` | Execution | M14 | orders, fills | `execution:read` | `src/app/execution/orders/page.tsx` |
| 23 | Open Positions | `/execution/positions` | Execution | M14 | paperPositions, positionsV2 | `execution:read` | `src/app/execution/positions/page.tsx` |
| 24 | Trade Monitoring | `/execution/monitoring` | Execution | M14 Trade management | positionsV2, paperPositions | `execution:read` | `src/app/execution/monitoring/page.tsx` |
| 25 | P&L & Analytics | `/performance/pnl` | Performance & Learning | M15 Outcomes & analytics | paperSummary, paperOutcomes, paperStats, aOverview, aStrategies | `analytics:read` | `src/app/performance/pnl/page.tsx` |
| 26 | Learning & Performance | `/performance/learning` | Performance & Learning | M15 | aAgents, aChannels, aIndependent, aDecisions, aInsights, aDrift, aDataQuality, aCalibration, aOutcomes | `analytics:read` | `src/app/performance/learning/page.tsx` |
| 27 | Notifications | `/notifications` | Settings & Administration | M05 Notifications | notifications | `notification:read` | `src/app/notifications/page.tsx` |
| 28 | User Settings | `/settings` | Settings & Administration | M01 | systemConfig | `settings:read` | `src/app/settings/page.tsx` |
| 29 | Broker Settings | `/settings/broker` | Settings & Administration | M01, Stage 10 boundary | broker | `settings:broker:read` | `src/app/settings/broker/page.tsx` |
| 30 | Administration & Audit | `/admin` | Settings & Administration | M01, M05 | admin, health | `admin:read` | `src/app/admin/page.tsx` |
