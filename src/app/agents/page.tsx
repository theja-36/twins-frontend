"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { Chip, DataBanner, Dot, Empty, PageHeader, Skeleton, SourceBadge, Stat, card } from "@/components/trading/ui";
import { ago } from "@/services/trading";
import { getAgentsStatus } from "@/services/system";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const { loaded, loading, refresh } = useLoaded(getAgentsStatus, 30_000);
  const s = loaded?.data;
  const mode = !s ? "…" : s.engine.enabled ? "Enforcing" : s.engine.shadow ? "Shadow" : "Off";
  return (
    <div className="space-y-6">
      <PageHeader title="Agent status" subtitle="The twelve research agents, how the engine is set, and the runs it has recorded." right={<SourceBadge source={loaded?.source} note={loaded?.note} loading={loading} />} />
      <DataBanner source={loaded?.source} note={loaded?.note} onRetry={refresh} />
      {!s ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /><Skeleton h={110} /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat title="Engine mode" value={mode} sub={s.engine.enabled ? "A halting verdict stops the flow" : s.engine.shadow ? "Evaluates and logs only; never stops anything" : "Not evaluating"} accent={mode === "Shadow"} />
            <Stat title="Agents" value={s.agents.length} sub={`${s.agents.filter((a) => a.required).length} required · ${s.agents.filter((a) => a.disabled).length} disabled`} />
            <Stat title="Halts on" value={s.engine.haltOn.length} sub={s.engine.haltOn.map((h) => h.replace("RESEARCH_", "").toLowerCase()).join(", ") || "nothing"} />
            <Stat title="Stored runs" value={s.persistedRuns} sub="Shadow results are logged, not stored" />
          </div>
          {s.engine.shadow && !s.engine.enabled && <div className="rounded-xl border border-royal-200 bg-royal-50/70 px-4 py-2.5 text-xs text-royal-800"><b>Shadow mode is on.</b> Each new risk decision is evaluated by the agents and the verdict is written to the worker log only (counts, no message text). Nothing here changes a decision. Several data sources are not connected yet, so many agents report &ldquo;unavailable&rdquo; and the overall verdict is usually blocked or incomplete.</div>}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {s.agents.map((a) => (
              <article key={a.agentId} className={cn(card, "p-4", a.disabled && "opacity-60")}>
                <div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-ink">{a.name}</h3><p className="font-mono text-[11px] text-slate-400">{a.agentId} · v{a.version}</p></div><div className="flex flex-wrap justify-end gap-1">{a.required && <Chip kind="OPEN">required</Chip>}{a.canBlock && <Chip kind="PENDING">can block</Chip>}{a.advisoryOnly && <Chip kind="CLOSED">advisory</Chip>}</div></div>
                <div className="mt-3"><div className="flex justify-between text-[11px] text-slate-500"><span>Weight</span><span className="font-mono">{a.weight}</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-royal-600" style={{ width: `${a.weight}%` }} /></div></div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-slate-400">Time limit</dt><dd className="font-mono text-ink">{a.timeoutMs >= 1000 ? `${+(a.timeoutMs / 1000).toFixed(1)} s` : `${a.timeoutMs} ms`}</dd></div><div><dt className="text-slate-400">Waits for</dt><dd className="text-ink">{a.dependsOn.length ? `${a.dependsOn.length} agents` : "nothing"}</dd></div></dl>
              </article>
            ))}
          </div>

          <section className={cn(card, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">Recent recorded runs</h2><span className="text-xs text-slate-400">{s.recentRuns.length} shown</span></div>
            {s.recentRuns.length === 0 ? <div className="p-5"><Empty title="No recorded runs" hint="Runs are stored only when the engine is enforcing. In shadow mode the verdicts are in the worker log." /></div> : (
              <ul className="divide-y divide-slate-50">{s.recentRuns.map((r) => (
                <li key={r.runId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0"><p className="text-sm font-medium text-ink">{r.assessment.replace("RESEARCH_", "").toLowerCase()} <span className="text-slate-400">· decision {r.riskDecisionId.slice(0, 8)} v{r.decisionVersion}</span></p><p className="mt-0.5 text-xs text-slate-400">{ago(r.startedAt)} · {r.durationMs === null ? "—" : `${r.durationMs} ms`} · {r.agents.map((x) => `${x.count} ${x.status.toLowerCase()}/${x.verdict.toLowerCase()}`).join(", ")}</p></div>
                  <span className="flex items-center gap-2 text-xs text-slate-500"><Dot tone={r.status === "COMPLETED" ? "ok" : "warn"} />{r.status.toLowerCase()}</span>
                </li>))}</ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
