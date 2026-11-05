export type SystemStatusLevel = 'healthy' | 'degraded' | 'critical';
export type ConnectionStatus = 'connected' | 'streaming' | 'reconnecting' | 'disconnected' | 'polling' | 'idle' | 'running' | 'paused';

export interface ServiceStatus {
  name: string;
  category: 'ingestion' | 'market_data' | 'intelligence' | 'execution' | 'security';
  status: ConnectionStatus;
  health: SystemStatusLevel;
  latencyMs?: number;
  lastActive: string;
  details: Record<string, string | number | boolean>;
}

export interface SystemHealthData {
  status: SystemStatusLevel;
  environment: 'production' | 'staging' | 'sandbox';
  version: string;
  uptimeSeconds: number;
  lastHeartbeat: string;
  executionLockActive: boolean; // Read-only safeguard
  services: {
    telegramIngestion: ServiceStatus;
    kiteFeed: ServiceStatus;
    decisionEngine: ServiceStatus;
    orderGateway: ServiceStatus;
    auditLogVerifier: ServiceStatus;
  };
  metrics: {
    telegramMessages24h: number;
    decisionsGenerated24h: number;
    pendingApprovals: number;
    ticksProcessedPerSec: number;
    activeMonitoredInstruments: number;
    securityIntegrityScore: number;
  };
}

export interface SnapshotExport {
  id: string;
  timestamp: string;
  type: 'eod_summary' | 'portfolio_mark' | 'risk_audit' | 'agent_state' | 'raw_telemetry';
  filename: string;
  sizeBytes: number;
  checksumSha256: string;
  recordCount: number;
  status: 'verified' | 'generating' | 'archived';
  storageBucket: string;
}

export type DecisionAction = 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
export type DecisionRiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SIMULATED';

export interface DecisionItem {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  source: 'telegram_channel' | 'technical_breakout' | 'sentiment_scan' | 'macro_signal';
  sourceMetadata?: {
    channelName?: string;
    messageSnippet?: string;
    senderHandle?: string;
    signalConfidence?: number;
  };
  ticker: string;
  exchange: 'NSE' | 'BSE' | 'NFO';
  action: DecisionAction;
  confidence: number; // 0 to 100
  rationale: string;
  proposedQty: number;
  estimatedPrice: number;
  proposedStopLoss?: number;
  proposedTarget?: number;
  riskScore: DecisionRiskScore;
  riskFactors: string[];
  status: ApprovalStatus;
  auditHash: string;
  expiryTimestamp: string;
  approverNotes?: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  trigger: 'telegram_message' | 'price_alert' | 'scheduled_eval' | 'manual_test';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  tokensScanned: number;
  decisionsEmitted: number;
  reasoningSnippet: string;
  memoryUsageMb: number;
}

export interface MarketTick {
  instrumentToken: number;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE' | 'NFO';
  lastPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  turnoverCr: number;
  lastTradeTime: string;
  bid: number;
  ask: number;
  marketDepth: {
    bids: Array<{ price: number; quantity: number; orders: number }>;
    asks: Array<{ price: number; quantity: number; orders: number }>;
  };
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SystemConfig {
  general: {
    systemName: string;
    mode: 'READ_ONLY_AUDIT' | 'LIVE_OBSERVER';
    orderPlacementAllowed: boolean;
    requireBiometricOr2FAForApproval: boolean;
    activeSessionId: string;
  };
  telegram: {
    botUsername: string;
    monitoredChannels: Array<{ id: string; name: string; priority: 'high' | 'normal' | 'low'; enabled: boolean }>;
    rateLimitPerMin: number;
    minConfidenceThreshold: number;
    keywordFilterList: string[];
  };
  kiteFeed: {
    userId: string;
    apiKeyMasked: string;
    tokenExpiry: string;
    autoReconnect: boolean;
    activeSubscriptionsCount: number;
    feedMode: 'full' | 'quote' | 'ltp';
  };
  riskEngine: {
    maxSinglePositionINR: number;
    maxPortfolioExposureINR: number;
    mandatoryStopLossPct: number;
    circuitBreakerDailyLossPct: number;
    killSwitchEngaged: boolean;
  };
  security: {
    immutableAuditHashing: boolean;
    ipAllowlist: string[];
    tlsCipherSuite: string;
    encryptionAlgorithm: string;
    lastSecurityAuditDate: string;
  };
}
