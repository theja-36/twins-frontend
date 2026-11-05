import {
  SystemHealthData,
  SnapshotExport,
  DecisionItem,
  AgentRun,
  MarketTick,
  CandleData,
  SystemConfig,
} from "@/types";
import {
  initialSystemHealth,
  initialSnapshots,
  initialDecisions,
  initialAgentRuns,
  initialMarketTicks,
  sampleCandles,
  initialSystemConfig,
} from "./mockData";

// API Base configuration for future real backend connection
const API_BASE_URL = process.env.NEXT_PUBLIC_TWINS_API_URL || null;

class TwinsApiService {
  private health: SystemHealthData = { ...initialSystemHealth };
  private snapshots: SnapshotExport[] = [...initialSnapshots];
  private decisions: DecisionItem[] = [...initialDecisions];
  private agentRuns: AgentRun[] = [...initialAgentRuns];
  private marketTicks: MarketTick[] = [...initialMarketTicks];
  private config: SystemConfig = { ...initialSystemConfig };

  // System Health
  async getSystemHealth(): Promise<SystemHealthData> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/health`);
      if (res.ok) return res.json();
    }
    // Update dynamic heartbeat
    this.health.lastHeartbeat = new Date().toISOString();
    return { ...this.health };
  }

  // Snapshots
  async getSnapshots(): Promise<SnapshotExport[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/snapshots`);
      if (res.ok) return res.json();
    }
    return [...this.snapshots];
  }

  // Decisions & Approvals
  async getDecisions(): Promise<DecisionItem[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/decisions`);
      if (res.ok) return res.json();
    }
    return [...this.decisions];
  }

  async getAgentRuns(): Promise<AgentRun[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents/runs`);
      if (res.ok) return res.json();
    }
    return [...this.agentRuns];
  }

  // Simulated decision approval/rejection (Audit demonstration in UI; read-only safe)
  async updateDecisionStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    notes?: string
  ): Promise<DecisionItem> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/decisions/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) return res.json();
    }

    const index = this.decisions.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Decision not found");

    this.decisions[index] = {
      ...this.decisions[index],
      status,
      approverNotes: notes || `Action logged via Twins Audit UI (${status})`,
    };

    // Update pending metric
    const pending = this.decisions.filter((d) => d.status === "PENDING_APPROVAL").length;
    this.health.metrics.pendingApprovals = pending;

    return { ...this.decisions[index] };
  }

  // Market Data (Read-only Kite Feed)
  async getMarketTicks(): Promise<MarketTick[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/market/ticks`);
      if (res.ok) return res.json();
    }
    return [...this.marketTicks];
  }

  async getCandles(symbol: string): Promise<CandleData[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/market/candles?symbol=${symbol}`);
      if (res.ok) return res.json();
    }
    return sampleCandles[symbol] || sampleCandles["RELIANCE"] || [];
  }

  // Simulated tick generator for live market feel (read-only)
  simulateTickUpdate(): MarketTick[] {
    this.marketTicks = this.marketTicks.map((tick) => {
      // 30% chance each second to produce slight tick movement
      if (Math.random() > 0.35) return tick;
      const variation = (Math.random() - 0.49) * (tick.lastPrice * 0.0012);
      const newPrice = Math.round((tick.lastPrice + variation) * 20) / 20;
      const diff = Math.round((newPrice - tick.prevClose) * 20) / 20;
      const diffPct = Math.round(((diff / tick.prevClose) * 100) * 100) / 100;

      return {
        ...tick,
        lastPrice: newPrice,
        change: diff,
        changePercent: diffPct,
        high: Math.max(tick.high, newPrice),
        low: Math.min(tick.low, newPrice),
        lastTradeTime: new Date().toISOString(),
      };
    });
    return [...this.marketTicks];
  }

  // Settings & Configuration (Safe & Read-only)
  async getSystemConfig(): Promise<SystemConfig> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/v1/config`);
      if (res.ok) return res.json();
    }
    return { ...this.config };
  }
}

export const twinsApi = new TwinsApiService();
