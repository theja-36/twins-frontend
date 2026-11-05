import { load } from "./trading";
import type { AgentsStatus, AppNotification, HealthStatus, SystemConfig } from "@/types/trading";

/** Fetchers for the system views (health, agents, notifications, configuration). Same rules as trading.ts: GET through the proxy, labelled mock fallback. */
const iso = (minAgo: number): string => new Date(Date.now() - minAgo * 60_000).toISOString();
const AGENT_NAMES: Array<[string, string, number]> = [["signal-integrity-v1", "Signal Integrity", 80], ["instrument-verification-v1", "Instrument Verification", 70], ["market-calendar-v1", "Market Calendar", 60], ["macro-global-v1", "Macro & Global", 50], ["news-sentiment-v1", "News & Sentiment", 50], ["index-constituent-impact-v1", "Index-Constituent Impact", 40], ["technical-structure-v1", "Technical Structure", 60], ["price-action-v1", "Price Action", 60], ["liquidity-v1", "Liquidity", 55], ["options-risk-v1", "Options Risk", 65], ["historical-pattern-v1", "Historical Pattern", 45], ["independent-challenger-v1", "Independent Challenger", 70]];

const MOCK_HEALTH = (): HealthStatus => ({ status: "ok", uptimeSeconds: 86_400, database: { ok: true, latencyMs: 12 }, redis: { ok: true, latencyMs: 2 }, runtimeState: { available: true, TRADING_ENABLED: false, INTAKE_ENABLED: true, KILL_SWITCH_ACTIVE: false }, outbox: { available: true, pending: 0, processing: 0, deadLetter: 0, completed: 113 }, lastSuccessfulBackupAt: iso(300), lastSuccessfulAuditVerificationAt: iso(40) });
const MOCK_AGENTS = (): AgentsStatus => ({
  engine: { enabled: false, shadow: true, haltOn: ["RESEARCH_BLOCKED", "RESEARCH_INCOMPLETE", "RESEARCH_ADVERSE"], requiredAgents: AGENT_NAMES.map(([id]) => id), disabledAgents: [], configValid: true }, shadowResultsStored: false, persistedRuns: 0, recentRuns: [],
  agents: AGENT_NAMES.map(([agentId, name, weight]) => ({ agentId, name, version: "1.0.0", weight, canBlock: true, advisoryOnly: false, timeoutMs: 5000, required: true, disabled: false, dependsOn: agentId === "independent-challenger-v1" ? AGENT_NAMES.slice(0, 11).map(([id]) => id) : [], inputs: ["risk_decision"] })),
});
const MOCK_NOTIFICATIONS = (): AppNotification[] => [
  { id: "n1", at: iso(6), kind: "paper_trade", severity: "info", title: "NIFTY: target hit", detail: "price 24440, qty 75" },
  { id: "n2", at: iso(22), kind: "paper_trade", severity: "warning", title: "RELIANCE: stopped out", detail: "price 2958, qty 400" },
  { id: "n3", at: iso(95), kind: "approval", severity: "info", title: "Decision approved by operator ***hana", detail: "decision 3f9a21c4" },
  { id: "n4", at: iso(240), kind: "paper_switch", severity: "warning", title: "Paper trading switched ON by operator ***hana", detail: "start of the paper period" },
  { id: "n5", at: iso(600), kind: "circuit_breaker", severity: "critical", title: "DAILY breaker: breach", detail: "DAILY_LIMIT" },
];
const MOCK_CONFIG = (): SystemConfig => ({
  source: "sample data", environment: { appEnv: "staging", tradingMode: "paper", liveTradingGuardPasses: true, liveTradingEnabled: false, brokerOrders: false }, runtimeControls: { TRADING_ENABLED: false, INTAKE_ENABLED: true, KILL_SWITCH_ACTIVE: false },
  agentEngine: { valid: true, enabled: false, shadow: true, requiredAgents: AGENT_NAMES.map(([id]) => id), disabledAgents: [], haltOn: ["RESEARCH_BLOCKED", "RESEARCH_INCOMPLETE", "RESEARCH_ADVERSE"], maxConcurrency: 4, thresholds: { supportiveMin: 0.35, neutralMin: -0.15, cautionMin: -0.5, adverseVetoWeight: 50 }, weights: {} },
  paperTrading: { armedByHost: false, switch: { enabled: false, version: 1, reason: "seeded OFF by migration 0031", changedBy: "service:migration", changedAt: iso(1000) }, effective: false, config: { slippageBps: 5, entryExpiryMinutes: 30, trail: { kind: "percent", value: 0.5 }, trailAfterTargets: 1, breakevenAfterTarget1: true, exitFractions: [0.5, 0.25, 0.25], squareOffIstMinutes: 920, maxPriceAgeSeconds: 120 } },
  risk: { sizing: { valid: true, maxRiskPct: 1 }, portfolio: { valid: true, maxOpenPositions: 5 }, circuitBreakers: { valid: true, dailyLossPct: 2, weeklyLossPct: 5, warnPct: 75 }, expiry: { valid: true, pendingMinutes: 30, approvedForReviewMinutes: 15 } },
});

export const getHealth = () => load<HealthStatus>("health/status", MOCK_HEALTH);
export const getAgentsStatus = () => load<AgentsStatus>("agents/status?limit=50", MOCK_AGENTS);
export const getNotifications = (limit = 100) => load<AppNotification[]>(`notifications?limit=${limit}`, MOCK_NOTIFICATIONS, (r) => r.notifications);
export const getSystemConfig = () => load<SystemConfig>("system/config", MOCK_CONFIG);
