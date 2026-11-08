import type { EndpointDef } from "./query";
import type * as T from "./contracts/types";
import type { ChannelNewsView, DecisionSummary, ApprovalSummary, HealthStatus, IntakeStatus, MarketSnapshot, PaperStatus, PositionView, SourceHealthProfile, SystemConfig, TelegramChannel, TelegramClaim, AgentsStatus, AppNotification, TradeOutcome, OutcomeStats, PnlSummary, Readiness } from "@/types/trading";
import catalogue from "./contracts/analytics.endpoints.json";

/**
 * ENDPOINT REGISTRY: every datum any screen shows is declared here with how (and whether) it can be obtained today.
 *  LEGACY_READ    a real GET route that exists on the backend and is on the proxy allow-list.
 *  CONTRACT_ONLY  the backend has the typed contract and stored data (Stages 04-08) but NO web route. Live mode says so; demo mode shows a labelled fixture.
 *  NEEDS_SESSION  must be owner-scoped to an authenticated user (Stage 01 sessions are not built). The shared bearer token is NOT a user identity, so live mode is "access denied", never a silent read.
 * The "dependency" text names the missing backend piece so each gap is visible, not hidden.
 */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const has = <X>(...keys: string[]) => (raw: unknown): X | null => (isObj(raw) && keys.every((k) => k in raw) ? (raw as X) : null);
const list = <X>(key: string) => (raw: unknown): X[] | null => (isObj(raw) && Array.isArray(raw[key]) ? (raw[key] as X[]) : null);
const arr = <X>(raw: unknown): X[] | null => (Array.isArray(raw) ? (raw as X[]) : null);

const A = "Stage 01 user sessions + a per-user GET route over";
const def = <X>(id: string, path: string, availability: EndpointDef<X>["availability"], validate: EndpointDef<X>["validate"], extra: Partial<EndpointDef<X>> = {}): EndpointDef<X> => ({ id, path, availability, validate, ...extra });
const analytics = (id: string, key: string) => {
  const e = catalogue.endpoints.find((x: { path: string }) => x.path.endsWith(`/${key}`));
  return { id: `analytics.${key}`, path: e?.path ?? `analytics/${key}`, availability: "NEEDS_SESSION" as const, permission: "analytics:read", dependency: `${A} packages/outcomes/src/contracts.ts (${e?.path ?? key})` , validate: has<T.AnalyticsEnvelope<unknown>>("data", "contractVersion") } satisfies Partial<EndpointDef<T.AnalyticsEnvelope<unknown>>>;
};
const an = <X,>(key: string): EndpointDef<T.AnalyticsEnvelope<X>> => analytics(key, key) as unknown as EndpointDef<T.AnalyticsEnvelope<X>>;

export const EP = {
  // ── legacy, really served ─────────────────────────────────────────────
  health: def<HealthStatus>("health", "health/status", "LEGACY_READ", has("status"), { refreshMs: 30_000 }),
  marketSnapshot: def<MarketSnapshot>("market.snapshot", "market/snapshot", "LEGACY_READ", has("indices", "providers"), { refreshMs: 30_000 }),
  marketSources: def<SourceHealthProfile>("market.sources", "market/sources", "LEGACY_READ", has("providers", "overall"), { refreshMs: 30_000 }),
  channels: def<{ channels: TelegramChannel[] }>("telegram.channels", "telegram/channels", "LEGACY_READ", has("channels"), { isEmpty: (d) => d.channels.length === 0, refreshMs: 60_000 }),
  claims: def<{ claims: TelegramClaim[] }>("telegram.claims", "telegram/claims?limit=100", "LEGACY_READ", has("claims"), { isEmpty: (d) => d.claims.length === 0, refreshMs: 30_000 }),
  channelNews: def<ChannelNewsView>("news.telegram", "news/telegram", "LEGACY_READ", has("status", "summary"), { refreshMs: 60_000 }),
  intake: def<IntakeStatus>("intake.status", "intake/status", "LEGACY_READ", has("counts", "total"), { refreshMs: 15_000 }),
  agentsStatus: def<AgentsStatus>("agents.status", "agents/status", "LEGACY_READ", has("agents", "engine")),
  notifications: def<AppNotification[]>("notifications", "notifications", "LEGACY_READ", (r) => arr<AppNotification>(r) ?? list<AppNotification>("notifications")(r), { isEmpty: (d) => d.length === 0, refreshMs: 30_000 }),
  systemConfig: def<SystemConfig>("system.config", "system/config", "LEGACY_READ", has("environment", "paperTrading")),
  legacyDecisions: def<DecisionSummary[]>("risk.decisions", "risk/decisions?limit=100", "LEGACY_READ", list<DecisionSummary>("decisions"), { isEmpty: (d) => d.length === 0, refreshMs: 30_000 }),
  legacyApprovals: def<ApprovalSummary[]>("risk.approvals", "risk/approvals?limit=100", "LEGACY_READ", (r) => arr<ApprovalSummary>(r) ?? list<ApprovalSummary>("approvals")(r), { isEmpty: (d) => d.length === 0 }),
  paperStatus: def<PaperStatus>("paper.status", "paper/status", "LEGACY_READ", has("mode", "summary"), { refreshMs: 30_000 }),
  paperSummary: def<PnlSummary>("paper.summary", "paper/summary", "LEGACY_READ", has("openPositions", "totalPnl"), { refreshMs: 30_000 }),
  paperPositions: def<PositionView[]>("paper.positions", "paper/positions", "LEGACY_READ", (r) => arr<PositionView>(r) ?? list<PositionView>("positions")(r), { isEmpty: (d) => d.length === 0, refreshMs: 30_000 }),
  paperOutcomes: def<TradeOutcome[]>("paper.outcomes", "paper/outcomes?limit=100", "LEGACY_READ", (r) => arr<TradeOutcome>(r) ?? list<TradeOutcome>("outcomes")(r), { isEmpty: (d) => d.length === 0 }),
  paperStats: def<OutcomeStats>("paper.stats", "paper/outcomes/stats", "LEGACY_READ", has("n", "winRate")),
  paperReadiness: def<Readiness>("paper.readiness", "paper/readiness", "LEGACY_READ", has("items", "blockers")),
  // ── Stages 04-07 contracts: typed, stored, but no web route yet ───────────
  opportunities: def<T.Opportunity[]>("opportunities", "opportunities", "CONTRACT_ONLY", list("opportunities"), { permission: "opportunity:read", dependency: "GET /opportunities over packages/database/src/stores/opportunityStore.ts (Stage 05 stores exist; no route)", isEmpty: (d) => d.length === 0 }),
  research: def<T.ResearchCase[]>("research.cases", "research/cases", "CONTRACT_ONLY", list("cases"), { permission: "research:read", dependency: "GET /research/cases over research_packages (Stage 04 stores exist; no route)", isEmpty: (d) => d.length === 0 }),
  agentCards: def<T.AgentCard[]>("research.agents", "research/agents", "CONTRACT_ONLY", list("agents"), { permission: "research:read", dependency: "GET /research/agents (agent registry + run stats; no route)" }),
  playbooks: def<T.Playbook[]>("research.playbooks", "research/playbooks", "CONTRACT_ONLY", list("playbooks"), { permission: "research:read", dependency: "GET /research/playbooks (Stage 04 playbook versions; no route)", isEmpty: (d) => d.length === 0 }),
  channelStrategy: def<T.ChannelStrategy[]>("research.channel-strategy", "research/channel-strategy", "CONTRACT_ONLY", list("channels"), { permission: "research:read", dependency: "GET /research/channel-strategy (per-channel pattern evidence; no route)", isEmpty: (d) => d.length === 0 }),
  evidence: def<T.EvidenceRecord[]>("evidence", "evidence", "CONTRACT_ONLY", list("evidence"), { permission: "research:read", dependency: "GET /evidence (research_packages evidence refs; no route)", isEmpty: (d) => d.length === 0 }),
  decisions: def<T.DecisionV2[]>("decisions", "decisions", "NEEDS_SESSION", list("decisions"), { permission: "decision:read", dependency: `${A} user_decisions (Stage 07 store: decisionStore)`, isEmpty: (d) => d.length === 0 }),
  riskOverview: def<T.RiskOverview>("risk.overview", "risk/overview", "NEEDS_SESSION", has("verdictCounts", "limits"), { permission: "risk:read", dependency: `${A} risk_assessments + risk_control_events` }),
  capital: def<T.CapitalProfile>("capital.profile", "capital/profile", "NEEDS_SESSION", has("totalCapital", "isolation"), { permission: "capital:read", dependency: `${A} capital_profiles (per-user; never pooled)` }),
  simulations: def<T.SimulationReport[]>("simulations", "simulations", "NEEDS_SESSION", list("simulations"), { permission: "simulation:read", dependency: `${A} stored simulation reports (Stage 06). The frontend never computes a simulation`, isEmpty: (d) => d.length === 0 }),
  approvals: def<{ pending: T.ApprovalItem[]; history: T.ApprovalHistoryItem[] }>("approvals", "approvals", "NEEDS_SESSION", has("pending", "history"), { permission: "decision:approve", dependency: "an authenticated user session AND a POST approval contract (none is published); until then this screen is read-only" }),
  executionControls: def<T.ExecutionControls>("execution.controls", "execution/controls", "CONTRACT_ONLY", has("modes", "liveExecutionAvailable"), { permission: "execution:read", dependency: "GET /execution/controls (mode gate + readiness gates; no route)" }),
  orders: def<T.PaperOrder[]>("execution.orders", "execution/orders", "NEEDS_SESSION", list("orders"), { permission: "execution:read", dependency: `${A} paper_orders (Stage 07 executionStore)`, isEmpty: (d) => d.length === 0 }),
  fills: def<T.PaperFill[]>("execution.fills", "execution/fills", "NEEDS_SESSION", list("fills"), { permission: "execution:read", dependency: `${A} paper_fills`, isEmpty: (d) => d.length === 0 }),
  positionsV2: def<T.PaperPositionV2[]>("execution.positions", "execution/positions", "NEEDS_SESSION", list("positions"), { permission: "execution:read", dependency: `${A} paper_positions`, isEmpty: (d) => d.length === 0 }),
  // ── Stage 08 analytics (real contract catalogue, packages/outcomes/src/contracts.ts) ──
  aOverview: an<T.OverviewData>("overview"), aStrategies: an<T.StrategyData>("strategies"), aChannels: an<T.ChannelsData>("channels"), aIndependent: an<T.IndependentData>("independent"), aAgents: an<T.AgentsData>("agents"),
  aDecisions: an<T.DecisionQualityData>("decisions"), aOutcomes: an<T.OutcomeRow[]>("outcomes"), aInsights: an<T.InsightRow[]>("insights"), aDrift: an<T.DriftData>("drift"), aDataQuality: an<T.DataQualityData>("data-quality"), aCalibration: an<T.CalibrationData>("calibration"),
  // ── platform ──
  broker: def<T.BrokerStatus>("settings.broker", "settings/broker", "NEEDS_SESSION", has("connection", "executionAllowed"), { permission: "settings:broker:read", dependency: `${A} broker connection status. Secrets are never returned or shown` }),
  admin: def<T.AdminOverview>("admin.overview", "admin/overview", "NEEDS_SESSION", has("users", "audit"), { permission: "admin:read", dependency: `${A} users, roles, audit chain and job status` }),
} as const;
export type EndpointKey = keyof typeof EP;
