import type { EndpointKey } from "@/api/registry";

/**
 * ONE registry drives the sidebar, breadcrumbs, command palette, route inventory, screen tracker and traceability tests.
 * Hiding a menu item is never authorisation: every screen enforces its own permission through its endpoint (see Data.tsx).
 */
export type NavGroup = "Overview" | "Market Intelligence" | "Telegram Intelligence" | "Research & Agents" | "Opportunities" | "Decisions" | "Risk & Capital" | "Execution" | "Performance & Learning" | "Settings & Administration";
export const GROUPS: readonly NavGroup[] = ["Overview", "Market Intelligence", "Telegram Intelligence", "Research & Agents", "Opportunities", "Decisions", "Risk & Capital", "Execution", "Performance & Learning", "Settings & Administration"];
export interface Screen { n: number; title: string; route: string; group: NavGroup | null; modules: string[]; endpoints: EndpointKey[]; permission: string; nav: boolean; component: string; test: string; keywords?: string }
const S = (n: number, title: string, route: string, group: NavGroup | null, modules: string[], endpoints: EndpointKey[], permission: string, component: string, o: Partial<Screen> = {}): Screen => ({ n, title, route, group, modules, endpoints, permission, nav: group !== null && !route.includes("["), component, test: "tests/routes.test.ts", ...o });

export const SCREENS: readonly Screen[] = [
  S(1, "Sign in", "/login", null, ["M01 Auth & access"], [], "public", "app/login/page.tsx"),
  S(2, "Dashboard", "/", "Overview", ["M01", "M05", "M12", "M14", "M15"], ["systemConfig", "marketSnapshot", "paperSummary", "intake", "decisions", "aOverview"], "mixed", "app/page.tsx", { keywords: "overview home" }),
  S(3, "Market Overview", "/market", "Market Intelligence", ["M02 Market context"], ["marketSnapshot", "marketSources", "channelNews"], "market:read", "app/market/page.tsx", { keywords: "indices regime calendar news sources" }),
  S(4, "Telegram Channels", "/telegram/channels", "Telegram Intelligence", ["M03 Telegram intake"], ["channels"], "telegram:read", "app/telegram/channels/page.tsx"),
  S(5, "Signal Intake", "/telegram/intake", "Telegram Intelligence", ["M03"], ["claims", "intake"], "telegram:read", "app/telegram/intake/page.tsx", { keywords: "claims queue" }),
  S(6, "Signal Details", "/telegram/signals/[id]", "Telegram Intelligence", ["M03", "M04 Claim assessment"], ["claims"], "telegram:read", "app/telegram/signals/[id]/page.tsx"),
  S(7, "Signal History", "/telegram/history", "Telegram Intelligence", ["M03"], ["claims"], "telegram:read", "app/telegram/history/page.tsx", { keywords: "signals past" }),
  S(8, "Evidence Explorer", "/evidence", "Research & Agents", ["M06 Research"], ["evidence"], "research:read", "app/evidence/page.tsx"),
  S(9, "Research Workspace", "/research", "Research & Agents", ["M06 Research"], ["research"], "research:read", "app/research/page.tsx"),
  S(10, "Agent Intelligence", "/research/agents", "Research & Agents", ["M07 Specialist agents"], ["agentCards", "agentsStatus"], "research:read", "app/research/agents/page.tsx", { keywords: "specialists market context" }),
  S(11, "Channel Strategy Intelligence", "/research/channel-strategy", "Research & Agents", ["M07", "M15"], ["channelStrategy"], "research:read", "app/research/channel-strategy/page.tsx"),
  S(12, "Strategy Playbooks", "/research/playbooks", "Research & Agents", ["M07"], ["playbooks"], "research:read", "app/research/playbooks/page.tsx"),
  S(13, "Independent Opportunities", "/opportunities", "Opportunities", ["M16 Independent opportunity engine"], ["opportunities"], "opportunity:read", "app/opportunities/page.tsx", { keywords: "scan candidates" }),
  S(14, "Decision Centre", "/decisions", "Decisions", ["M12 Decision engine"], ["decisions"], "decision:read", "app/decisions/page.tsx"),
  S(15, "Decision Detail", "/decisions/[id]", "Decisions", ["M12", "M09 Stop-loss", "M10 Confidence"], ["decisions", "simulations"], "decision:read", "app/decisions/[id]/page.tsx"),
  S(16, "Risk Dashboard", "/risk", "Risk & Capital", ["M11 Risk control"], ["riskOverview"], "risk:read", "app/risk/page.tsx"),
  S(17, "Capital Management", "/capital", "Risk & Capital", ["M08 Capital & sizing"], ["capital"], "capital:read", "app/capital/page.tsx"),
  S(18, "What-if Simulator", "/simulator", "Risk & Capital", ["M11", "M08"], ["simulations"], "simulation:read", "app/simulator/page.tsx", { keywords: "scenario estimate" }),
  S(19, "Approval Centre", "/approvals", "Decisions", ["M12", "M13 Human approval"], ["approvals"], "decision:approve", "app/approvals/page.tsx"),
  S(20, "Paper Trading", "/execution/paper", "Execution", ["M14 Paper execution"], ["paperStatus", "paperSummary", "paperReadiness"], "execution:read", "app/execution/paper/page.tsx"),
  S(21, "Live Execution Controls", "/execution/live", "Execution", ["M14"], ["executionControls", "systemConfig"], "execution:read", "app/execution/live/page.tsx", { keywords: "kill switch modes" }),
  S(22, "Orders & Fills", "/execution/orders", "Execution", ["M14"], ["orders", "fills"], "execution:read", "app/execution/orders/page.tsx"),
  S(23, "Open Positions", "/execution/positions", "Execution", ["M14"], ["paperPositions", "positionsV2"], "execution:read", "app/execution/positions/page.tsx"),
  S(24, "Trade Monitoring", "/execution/monitoring", "Execution", ["M14 Trade management"], ["positionsV2", "paperPositions"], "execution:read", "app/execution/monitoring/page.tsx"),
  S(25, "P&L & Analytics", "/performance/pnl", "Performance & Learning", ["M15 Outcomes & analytics"], ["paperSummary", "paperOutcomes", "paperStats", "aOverview", "aStrategies"], "analytics:read", "app/performance/pnl/page.tsx"),
  S(26, "Learning & Performance", "/performance/learning", "Performance & Learning", ["M15"], ["aAgents", "aChannels", "aIndependent", "aDecisions", "aInsights", "aDrift", "aDataQuality", "aCalibration", "aOutcomes"], "analytics:read", "app/performance/learning/page.tsx"),
  S(27, "Notifications", "/notifications", "Settings & Administration", ["M05 Notifications"], ["notifications"], "notification:read", "app/notifications/page.tsx"),
  S(28, "User Settings", "/settings", "Settings & Administration", ["M01"], ["systemConfig"], "settings:read", "app/settings/page.tsx"),
  S(29, "Broker Settings", "/settings/broker", "Settings & Administration", ["M01", "Stage 10 boundary"], ["broker"], "settings:broker:read", "app/settings/broker/page.tsx"),
  S(30, "Administration & Audit", "/admin", "Settings & Administration", ["M01", "M05"], ["admin", "health"], "admin:read", "app/admin/page.tsx"),
];
export const MODULES = ["M01 Auth & access", "M02 Market context", "M03 Telegram intake", "M04 Claim assessment", "M05 Notifications", "M06 Research", "M07 Specialist agents", "M08 Capital & sizing", "M09 Stop-loss", "M10 Confidence", "M11 Risk control", "M12 Decision engine", "M13 Human approval", "M14 Paper execution", "M15 Outcomes & analytics", "M16 Independent opportunity engine"] as const;

const toRe = (route: string): RegExp => new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/")}\\/?$`);
export function screenFor(path: string): Screen | undefined { return SCREENS.find((s) => toRe(s.route).test(path)); }
export function crumbs(path: string): Array<{ label: string; href?: string }> {
  const s = screenFor(path); if (!s || s.route === "/") return [{ label: "Dashboard" }];
  const out: Array<{ label: string; href?: string }> = [{ label: "Dashboard", href: "/" }];
  if (s.group && s.group !== "Overview") out.push({ label: s.group });
  if (s.route.includes("[")) { const parent = SCREENS.find((x) => x.route === s.route.replace(/\/\[[^\]]+\]$/, "") || (s.route.startsWith("/telegram/signals") && x.route === "/telegram/history")); if (parent) out.push({ label: parent.title, href: parent.route }); }
  out.push({ label: s.title }); return out;
}
export const NAV = GROUPS.map((g) => ({ group: g, items: SCREENS.filter((s) => s.nav && s.group === g) })).filter((g) => g.items.length > 0);
