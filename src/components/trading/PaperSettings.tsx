"use client";
import React from "react";
import { useLoaded } from "./hooks";
import { SourceBadge, card } from "./ui";
import { getPaperStatus, LIVE } from "@/services/trading";
import { cn } from "@/lib/utils";

const hhmm = (m: number | null): string => (m === null ? "never" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")} IST`);

/** Read-only view of the paper-trading configuration the backend is running with. Settings are changed on the server, never from here. */
export function PaperSettings() {
  const { loaded, loading } = useLoaded(getPaperStatus, 60_000);
  const s = loaded?.data;
  const rows: Array<[string, string]> = s ? [
    ["Paper trading", s.enabled ? "Running" : "Switched off"], ["Slippage on simulated fills", `${s.slippageBps} bps (always against you)`], ["Cancel an unfilled entry after", `${s.entryExpiryMinutes} min`],
    ["Trailing stop", s.trail.kind === "none" ? "Off" : `${s.trail.value}${s.trail.kind === "percent" ? "%" : " points"} behind the best price`], ["Move stop to break-even after target 1", s.breakevenAfterTarget1 ? "Yes" : "No"],
    ["Exit split at targets 1 / 2 / 3", s.exitFractions.map((f) => `${Math.round(f * 100)}%`).join(" / ")], ["Square off open trades at", hhmm(s.squareOffIstMinutes)],
  ] : [];
  return (
    <section className={cn(card, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-ink">Paper trading</h2><SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} /></div>
      <p className="mt-1 text-sm text-slate-500">How simulated trades are entered, protected and closed. Changed on the server, shown here read-only.</p>
      <dl className="mt-4 divide-y divide-slate-100 text-sm">{rows.map(([k, v]) => <div key={k} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-mono font-medium text-ink">{v}</dd></div>)}</dl>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">{["Live trading: locked", "Broker orders: none exist", "Approval: human only"].map((t) => <div key={t} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">{t}</div>)}</div>
      <p className="mt-4 text-xs text-slate-400">Backend connection: {LIVE ? "live mode requested (NEXT_PUBLIC_TWINS_LIVE=1); the server proxy holds the API address and token, never this page." : "mock mode. Set NEXT_PUBLIC_TWINS_LIVE=1 and, on the server, TWINS_API_URL and TWINS_API_KEY."}</p>
    </section>
  );
}
