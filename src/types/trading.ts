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
export interface PaperStatus {
  mode: "paper"; enabled: boolean; liveTradingEnabled: false; brokerOrders: false; slippageBps: number; entryExpiryMinutes: number; trail: { kind: string; value?: number };
  breakevenAfterTarget1: boolean; exitFractions: number[]; squareOffIstMinutes: number | null; summary: PnlSummary;
}
export interface TradeOutcome { tradeId: string; riskDecisionId: string; symbol: string; side: string; outcome: "WIN" | "LOSS" | "BREAKEVEN"; pnl: number; rMultiple: number; closeReason: string; targetsHit: number; holdingSeconds: number; mfeR: number; maeR: number; closedAt: string }
export interface GroupStats { n: number; wins: number; losses: number; breakeven: number; winRate: number | null; avgR: number | null; totalR: number; totalPnl: number }
export interface OutcomeStats extends GroupStats {
  avgWinR: number | null; avgLossR: number | null; expectancyR: number | null; profitFactor: number | null; maxDrawdownR: number; avgHoldingSeconds: number | null;
  byCloseReason: Record<string, GroupStats>; bySourceTrustTier: Record<string, GroupStats>; byResearchAssessment: Record<string, GroupStats>; minSampleForMeaning: number; sampleIsMeaningful: boolean;
}
export type DataSource = "live" | "mock" | "mock-fallback";
export interface Loaded<T> { data: T; source: DataSource; note?: string }
