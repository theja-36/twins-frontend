import type { PositionView, TradeOutcome } from "@/types/trading";

/** Pure portfolio helpers (unit tested). */
export interface CurvePoint { at: string; pnl: number; r: number; drawdownR: number }

/** Cumulative P&L and R in closing order, with the running drawdown in R (peak to current, >= 0). Outcomes are expected newest-first or oldest-first; they are sorted here. */
export function equityCurve(outcomes: readonly TradeOutcome[]): CurvePoint[] {
  const sorted = [...outcomes].filter((o) => Number.isFinite(o.pnl) && Number.isFinite(o.rMultiple)).sort((a, b) => (a.closedAt < b.closedAt ? -1 : a.closedAt > b.closedAt ? 1 : 0));
  let pnl = 0, r = 0, peak = 0;
  return sorted.map((o) => { pnl += o.pnl; r += o.rMultiple; peak = Math.max(peak, r); return { at: o.closedAt, pnl: Math.round(pnl * 100) / 100, r: Math.round(r * 100) / 100, drawdownR: Math.round((peak - r) * 100) / 100 }; });
}

export function currentDrawdownR(curve: readonly CurvePoint[]): number { return curve.length ? (curve[curve.length - 1] as CurvePoint).drawdownR : 0; }

/** Open-position exposure by symbol, largest first, as a share of the total. */
export function exposureBySymbol(positions: readonly PositionView[]): Array<{ symbol: string; notional: number; share: number }> {
  const open = positions.filter((p) => p.state === "OPEN" || p.state === "PENDING_ENTRY");
  const by = new Map<string, number>();
  for (const p of open) by.set(p.symbol, (by.get(p.symbol) ?? 0) + Math.abs((p.fillPrice ?? p.entryPrice) * p.remainingQuantity));
  const total = [...by.values()].reduce((a, b) => a + b, 0);
  return [...by].map(([symbol, notional]) => ({ symbol, notional: Math.round(notional), share: total === 0 ? 0 : Math.round((notional / total) * 1000) / 10 })).sort((a, b) => b.notional - a.notional);
}

/** Sum of P&L for trades closed today (local time) plus the open positions' unrealised P&L. */
export function dayPnl(outcomes: readonly TradeOutcome[], positions: readonly PositionView[], now: Date): number {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const realized = outcomes.filter((o) => Date.parse(o.closedAt) >= start.getTime()).reduce((a, o) => a + o.pnl, 0);
  const open = positions.filter((p) => p.state === "OPEN").reduce((a, p) => a + p.unrealizedPnl, 0);
  return Math.round((realized + open) * 100) / 100;
}
