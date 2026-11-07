/** Shapes returned by the Twins backend (read-only API). Numbers arrive as numbers or numeric strings exactly as the backend sends them. */
export interface DecisionSummary {
  id: string; version: number; status: string; effectiveStatus: string; subjectKind: "signal" | "options_claim"; market: string | null; instrumentType: string; symbol: string;
  expiry: string | null; strike: string | null; optionType: string | null; side: string | null; entryPrice: string | null; stopLoss: string | null; targets: string[];
  plannedQuantity: string | null; plannedNotional: string | null; plannedMaxLossAmount: string | null; riskReward: string | null; confidenceScore: string | null; sourceTrustTier: string | null;
  reasonCode: string; createdAt: string;
}
export interface ApprovalSummary { id: string; riskDecisionId: string; decisionVersion: number; action: string; actorType: string; actorRef: string; reason: string | null; createdAt: string }

export interface PositionView {
  tradeId: string; riskDecisionId: string; symbol: string; side: "BUY" | "SELL"; state: "PENDING_ENTRY" | "OPEN" | "CLOSED" | "CANCELLED"; quantity: number; remainingQuantity: number;
  entryPrice: number; fillPrice: number | null; stop: number; targets: number[]; targetsHit: number; trailingActive: boolean; lastPrice: number | null;
  realizedPnl: number; unrealizedPnl: number; totalPnl: number; rMultiple: number | null; openedAt: string | null;
}
export interface PnlSummary { openPositions: number; pendingEntries: number; closedTrades: number; cancelledTrades: number; exposure: number; realizedPnl: number; unrealizedPnl: number; totalPnl: number }
export interface SwitchState { enabled: boolean; version: number; reason: string; changedBy: string; changedAt: string }
export interface PaperStatus {
  mode: "paper"; enabled: boolean; armedByHost?: boolean; switch?: SwitchState | null; switchHistory?: Array<{ version: number; previousEnabled: boolean; enabled: boolean; reason: string; changedBy: string; changedAt: string }>; liveTradingEnabled: false; brokerOrders: false; slippageBps: number; entryExpiryMinutes: number; trail: { kind: string; value?: number };
  breakevenAfterTarget1: boolean; exitFractions: number[]; squareOffIstMinutes: number | null; summary: PnlSummary;
}
export interface TradeOutcome { tradeId: string; riskDecisionId: string; symbol: string; side: string; outcome: "WIN" | "LOSS" | "BREAKEVEN"; pnl: number; rMultiple: number; closeReason: string; targetsHit: number; holdingSeconds: number; mfeR: number; maeR: number; closedAt: string }
export interface GroupStats { n: number; wins: number; losses: number; breakeven: number; winRate: number | null; avgR: number | null; totalR: number; totalPnl: number }
export interface OutcomeStats extends GroupStats {
  avgWinR: number | null; avgLossR: number | null; expectancyR: number | null; profitFactor: number | null; maxDrawdownR: number; avgHoldingSeconds: number | null;
  byCloseReason: Record<string, GroupStats>; bySourceTrustTier: Record<string, GroupStats>; byResearchAssessment: Record<string, GroupStats>; minSampleForMeaning: number; sampleIsMeaningful: boolean;
}
export type DataSource = "live";
export interface Loaded<T> { data: T; source: DataSource; note?: string }

export interface HealthStatus {
  status: string; uptimeSeconds?: number; database?: { ok: boolean; latencyMs?: number }; redis?: { ok: boolean; latencyMs?: number };
  runtimeState?: { available: boolean; TRADING_ENABLED?: boolean; INTAKE_ENABLED?: boolean; KILL_SWITCH_ACTIVE?: boolean };
  outbox?: { available: boolean; pending: number; processing: number; deadLetter: number; completed: number };
  lastSuccessfulBackupAt?: string | null; lastSuccessfulAuditVerificationAt?: string | null;
}
export interface AgentInfo { agentId: string; name: string; version: string; weight: number; canBlock: boolean; advisoryOnly: boolean; timeoutMs: number; required: boolean; disabled: boolean; dependsOn: string[]; inputs: string[] }
export interface AgentRunSummary { runId: string; riskDecisionId: string; decisionVersion: number; status: string; assessment: string; score: number | null; startedAt: string; durationMs: number | null; agents: Array<{ status: string; verdict: string; count: number }> }
export interface AgentsStatus { engine: { enabled: boolean; shadow: boolean; haltOn: string[]; requiredAgents: string[]; disabledAgents: string[]; configValid: boolean }; shadowResultsStored: boolean; agents: AgentInfo[]; persistedRuns: number; recentRuns: AgentRunSummary[] }
export interface AppNotification { id: string; at: string; kind: string; severity: "critical" | "warning" | "info"; title: string; detail: string | null }
export interface SystemConfig {
  source: string; environment: { appEnv: string | null; tradingMode: string | null; liveTradingGuardPasses: boolean; liveTradingEnabled: false; brokerOrders: false };
  runtimeControls: RuntimeControls | null;
  agentEngine: { valid: boolean; enabled?: boolean; shadow?: boolean; requiredAgents?: string[]; disabledAgents?: string[]; haltOn?: string[]; maxConcurrency?: number; thresholds?: Record<string, number>; weights?: Record<string, number> };
  paperTrading: { armedByHost: boolean; switch: SwitchState | null; effective: boolean; config: { slippageBps: number; entryExpiryMinutes: number; trail: { kind: string; value?: number }; trailAfterTargets: number; breakevenAfterTarget1: boolean; exitFractions: number[]; squareOffIstMinutes: number | null; maxPriceAgeSeconds: number } | null };
  risk: Record<"sizing" | "portfolio" | "circuitBreakers" | "expiry", Record<string, unknown> & { valid: boolean }>;
}

/** The backend's runtime safety snapshot (camelCase). Any field may be missing if the backend could not read it: the UI must then say "unreadable", never assume a safe value. */
export interface RuntimeControls { tradingEnabled?: boolean; intakeEnabled?: boolean; killSwitchActive?: boolean; versions?: Record<string, number> }

export interface IntakeStatus {
  counts: Record<string, number>; total: number; oldestOpenSeconds: number | null; lastReceivedAt: string | null; lastCompletedAt: string | null;
  recent: Array<{ id: string; type: string; status: string; attempts: number; receivedAt: string | null; completedAt: string | null; channel: string }>;
}
export interface SnapshotFile { kind: string; present: boolean; bytes: number; asOf: string | null; ageSeconds: number | null }
export interface IndexPrice { market: string; symbol: string; level: number; previousClose: number | null; changePct1d: number | null; asOf: string; ageSeconds: number | null }
export interface ProviderFile { name: string; present: boolean; format: string | null; source: string | null; asOf: string | null; ageSeconds: number | null; count: number | null }
export interface MarketSnapshot { visible: boolean; generation: { status: string; id: string | null } | null; files: SnapshotFile[]; indices: IndexPrice[]; quoteCount: number; optionQuoteCount: number; providers: ProviderFile[] }
export type SourceStatus = "OK" | "DEGRADED" | "STALE" | "FAILING" | "MISSING" | "INVALID";
export interface ProviderHealth { provider: string; status: SourceStatus; reasons: string[]; asOf: string | null; dataAgeSeconds: number | null; exportAgeSeconds: number | null; count: number | null; source: string | null; consecutiveFailures: number | null; usable: boolean }
export interface SourceHealthProfile { generatedAt: string; overall: SourceStatus; passLogAvailable: boolean; counts: Record<SourceStatus, number>; providers: ProviderHealth[] }
export interface ReadinessItem { id: string; title: string; status: "pass" | "fail" | "info" | "manual"; blocking: boolean; detail: string }
export interface Readiness { readyToEnable: boolean; enabledNow: boolean; blockers: string[]; items: ReadinessItem[] }

/** The backend's read-only explainable decision card (GET risk/decisions/:id/decision-card). Codes and numbers only. */
export interface DecisionCardData {
  format: string; riskDecisionId: string; decisionVersion: number | null; runId: string | null;
  headline: { assessment: string; decidedBy: string; score: number | null; halts: boolean; haltReason: string };
  agents: Array<{ agentId: string; verdict: string; status: string; confidence: number | null; weight: number; required: boolean; scored: boolean; reasonCodes: string[]; errorCode: string | null }>;
  blockers: Array<{ agentId: string; findingCodes: string[] }>;
  unavailable: Array<{ agentId: string; status: string; errorCode: string | null; required: boolean }>;
  closeCalls: Array<{ rule: string; threshold: number; value: number; met: boolean; margin: number }>;
  sizing: { status: string; reasonCode: string | null; quantity: number; maxLossPercent: number | null; riskReward: number | null; trustTier: string | null } | null;
  sourceHealth: { overall: string; notUsable: Array<{ provider: string; status: string; reasons: string[] }> } | null;
  statements: string[];
  grantsApproval: false;
}

/** Backend GET telegram/channels (masked identifiers, counts, no message content). Added after the Phase 2 backend deploy. */
export interface TelegramChannel { id: string; channel: string; name: string | null; messages: number; revisions: number; claims: { claim: number; ambiguous: number; unsupported: number }; firstMessageAt: string | null; lastMessageAt: string | null; lastMessageAgeSeconds: number | null; captureAllowed: boolean | null }
/** Backend GET telegram/claims: parsed fields only. */
export interface TelegramClaim {
  id: string; channel: string; receivedAt: string | null; ageSeconds: number | null; parserVersion: string; resultKind: "claim" | "ambiguous" | "unsupported" | null; assessmentOutcome: "INSUFFICIENT_EVIDENCE" | "REJECT" | null;
  claim: { action: "buy" | "sell" | null; underlying: string | null; strike: number | null; optionType: "CE" | "PE" | null; entry: { type: string | null; price: number | null; low: number | null; high: number | null }; stopLoss: number | null; targets: number[]; levelBasis: string | null; levelBasisInferred: boolean; levelBasisConflict: boolean; expiry: { status: string | null; day: number | null; month: number | null; year: number | null } } | null;
  blockers: Array<{ code: string; severity: string }>;
}
