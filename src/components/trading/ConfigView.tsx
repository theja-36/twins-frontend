"use client";
import React from "react";
import { useLoaded } from "./hooks";
import { DataBanner, Dot, KV, Section, SourceBadge, Skeleton } from "./ui";
import { ago } from "@/services/trading";
import { controlOf, getSystemConfig } from "@/services/system";

const hhmm = (m: number | null): string => (m === null ? "never" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")} IST`);
const pretty = (k: string): string => k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").toLowerCase();
const fmt = (v: unknown): string => (v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
const yn = (b: boolean | undefined, yes = "Yes", no = "No") => <span className="inline-flex items-center gap-2"><Dot tone={b ? "ok" : "off"} />{b ? yes : no}</span>;

/** Full, read-only view of how the system is configured (as the API process sees it). Nothing here can be changed from the browser. */
export function ConfigView() {
  const { loaded, loading, refresh } = useLoaded(getSystemConfig, 60_000);
  const c = loaded?.data;
  if (!c) return <Skeleton h={320} />;
  const p = c.paperTrading, e = c.agentEngine;
  const kill = controlOf(c.runtimeControls, "killSwitchActive"), intake = controlOf(c.runtimeControls, "intakeEnabled"), trading = controlOf(c.runtimeControls, "tradingEnabled");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-500">Read-only. Settings are changed on the server; this page only shows them. Source: {c.source}.</p><SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} /></div>
      <DataBanner source={loaded?.source} note={loaded?.note} onRetry={refresh} />

      <Section title="Safety posture" hint="The switches that decide whether anything real can happen.">
        <KV rows={[
          ["Environment", `${c.environment.appEnv ?? "—"} · mode ${c.environment.tradingMode ?? "—"}`], ["Live trading", <span key="l" className="inline-flex items-center gap-2"><Dot tone="ok" />Locked (cannot be enabled)</span>], ["Broker orders", <span key="b" className="inline-flex items-center gap-2"><Dot tone="ok" />None exist</span>],
          ["Live-trading guard", yn(c.environment.liveTradingGuardPasses, "Passing", "FAILING")], ["Kill switch", kill === undefined ? <span key="k" className="inline-flex items-center gap-2"><Dot tone="warn" />unreadable</span> : yn(!kill, "Clear", "ACTIVE")], ["Intake", intake === undefined ? "unreadable" : yn(intake, "On", "Off")], ["Trading control", trading === undefined ? "unreadable" : yn(trading, "On", "Off")],
        ]} />
      </Section>

      <Section title="Paper trading" hint="Simulation only. It runs only when BOTH keys are on.">
        <KV rows={[
          ["Running now", yn(p.effective, "Yes", "No")], ["Key 1: armed by the host", yn(p.armedByHost, "Armed", "Not armed")], ["Key 2: audited switch", p.switch ? <span key="s" className="inline-flex flex-wrap items-center gap-2">{yn(p.switch.enabled, "ON", "OFF")}<span className="text-xs font-normal text-slate-400">v{p.switch.version} · {p.switch.changedBy} · {ago(p.switch.changedAt)}</span></span> : "unreadable"],
          ...(p.config ? ([
            ["Slippage on simulated fills", `${p.config.slippageBps} bps (always against you)`], ["Cancel an unfilled entry after", `${p.config.entryExpiryMinutes} min`], ["Trailing stop", p.config.trail.kind === "none" ? "Off" : `${p.config.trail.value}${p.config.trail.kind === "percent" ? "%" : " points"} behind the best price, after ${p.config.trailAfterTargets} target(s)`],
            ["Break-even after target 1", p.config.breakevenAfterTarget1 ? "Yes" : "No"], ["Exit split at targets 1 / 2 / 3", p.config.exitFractions.map((f) => `${Math.round(f * 100)}%`).join(" / ")], ["Square off open trades at", hhmm(p.config.squareOffIstMinutes)], ["Ignore prices older than", `${p.config.maxPriceAgeSeconds} s`],
          ] as Array<[string, React.ReactNode]>) : []),
        ]} />
      </Section>

      <Section title="Research agent engine">
        {!e.valid ? <p className="text-sm text-rose-600">The engine configuration is invalid on the server.</p> : (
          <KV rows={[["Enforcing mode", yn(e.enabled, "On", "Off")], ["Shadow mode", yn(e.shadow, "On (evaluate and log only)", "Off")], ["Required agents", String(e.requiredAgents?.length ?? 0)], ["Disabled agents", e.disabledAgents?.length ? e.disabledAgents.join(", ") : "none"], ["Halts the flow on", e.haltOn?.map((h) => h.replace("RESEARCH_", "").toLowerCase()).join(", ") || "nothing"], ["Parallel agents", String(e.maxConcurrency ?? "—")], ...Object.entries(e.thresholds ?? {}).map(([k, v]) => [`Threshold: ${pretty(k)}`, String(v)] as [string, React.ReactNode])]} />
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {([["Position sizing", "sizing"], ["Portfolio limits", "portfolio"], ["Circuit breakers", "circuitBreakers"], ["Decision expiry", "expiry"]] as const).map(([title, key]) => {
          const r = c.risk[key];
          return <Section key={key} title={title}>{r.valid === false ? <p className="text-sm text-rose-600">Invalid on the server.</p> : <KV rows={Object.entries(r).filter(([k]) => k !== "valid").map(([k, v]) => [pretty(k), fmt(v)] as [string, React.ReactNode])} />}</Section>;
        })}
      </div>
    </div>
  );
}
