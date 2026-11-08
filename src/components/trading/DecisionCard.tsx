"use client";

import React from "react";
import Link from "next/link";
import { Chip, Dot, Empty, KV, PageHeader, SafetyNote, Skeleton, card } from "@/components/trading/ui";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, Send } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/Motion";
import { Tip } from "@/components/motion/Controls";
import { useToast } from "@/components/motion/Toast";
import { BackendError, reportError, reportOk } from "@/services/backendState";
import { inr, px } from "@/services/trading";
import type { DecisionCardData, DecisionSummary } from "@/types/trading";
import { cn } from "@/lib/utils";

/**
 * Read-only decision card. Approval is NOT done here: it stays in the Telegram approval bot (owner decision 2026-11-07, Option A). A missing or unreadable assessment is a normal state of the
 * data (the engine only runs in shadow today), so it is shown on the page and does NOT raise the global backend-error banner.
 */
type CardState = { kind: "loading" } | { kind: "card"; card: DecisionCardData } | { kind: "none" } | { kind: "unreadable" } | { kind: "error" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VERDICT_KIND: Record<string, string> = { SUPPORTIVE: "WIN", NEUTRAL: "CLOSED", CAUTION: "PENDING", ADVERSE: "LOSS", BLOCKING: "REJECTED", UNAVAILABLE: "CANCELLED" };
const ASSESSMENT_TEXT: Record<string, string> = { RESEARCH_SUPPORTIVE: "Research: supportive", RESEARCH_NEUTRAL: "Research: neutral", RESEARCH_CAUTION: "Research: caution", RESEARCH_ADVERSE: "Research: adverse", RESEARCH_BLOCKED: "Research: blocked", RESEARCH_INCOMPLETE: "Research: incomplete" };
const words = (c: string): string => c.replaceAll("_", " ").replaceAll(".", " ").toLowerCase();

async function get(path: string, key: string): Promise<Response> {
  let res: Response;
  try { res = await fetch(`/api/twins/${path}`, { cache: "no-store" }); } catch { reportError("unreachable", key); throw new BackendError("unreachable"); }
  if (res.status === 503) { reportError("not_configured", key); throw new BackendError("not_configured"); }
  if (res.status === 401) { reportError("unauthorized", key); throw new BackendError("unauthorized"); }
  if (res.status >= 500) { reportError("unreachable", key); throw new BackendError("unreachable"); }
  return res;
}

export function DecisionCardPanel({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const valid = UUID.test(id);
  const [state, setState] = React.useState<CardState>({ kind: "loading" });
  const [summary, setSummary] = React.useState<DecisionSummary | null>(null);

  React.useEffect(() => {
    if (!valid) return;
    let alive = true;
    const run = async (): Promise<void> => {
      try {
        const res = await get(`risk/decisions/${id}/decision-card`, "risk/decisions/:id/decision-card");
        if (!alive) return;
        if (res.status === 200) { reportOk("risk/decisions/:id/decision-card"); setState({ kind: "card", card: (await res.json()) as DecisionCardData }); }
        else if (res.status === 404) { reportOk("risk/decisions/:id/decision-card"); setState({ kind: "none" }); }
        else if (res.status === 422) { reportOk("risk/decisions/:id/decision-card"); setState({ kind: "unreadable" }); }
        else { reportError("bad_answer", "risk/decisions/:id/decision-card"); setState({ kind: "error" }); }
      } catch { if (alive) setState({ kind: "error" }); }
      try {
        const res = await get(`risk/decisions/${id}/summary`, "risk/decisions/:id/summary");
        if (alive && res.status === 200) { reportOk("risk/decisions/:id/summary"); setSummary((await res.json()) as DecisionSummary); }
      } catch { /* the shared backend state reports it */ }
    };
    void run();
    const t = setInterval(() => void run(), 30_000);
    return () => { alive = false; clearInterval(t); };
  }, [id, valid]);

  if (!valid) return <Empty title="Not a decision id" hint="The link must contain a decision id. Open it from the Approvals or Signals page." />;
  const title = summary ? (summary.instrumentType === "option" ? `${summary.symbol} ${summary.strike ?? ""} ${summary.optionType ?? ""}`.trim() : summary.symbol) : "Decision";

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {embedded ? <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">{title}</h2><Link href={`/decision/${id}`} className="text-xs font-medium text-royal-600 hover:underline">Open full page</Link></div> : <PageHeader title={title} subtitle="Why the research agents reached this view, and what sits behind it. Read-only: this page cannot approve, reject or place anything." right={<Link href="/decisions" className="text-xs font-medium text-royal-600 hover:underline">Back to decisions</Link>} />}
      <SafetyNote>Approving is done in the Telegram approval bot, which re-checks every gate. A web approval button needs its own safety review and is on hold.</SafetyNote>
      {summary ? (
        <section className={cn(card, "p-5")}>
          <KV rows={[
            ["Side", summary.side ?? "—"], ["Entry", summary.entryPrice ? px(Number(summary.entryPrice)) : "—"], ["Stop", summary.stopLoss ? px(Number(summary.stopLoss)) : "—"],
            ["Targets", summary.targets.length ? summary.targets.map((t) => px(Number(t))).join(" / ") : "—"], ["Quantity", summary.plannedQuantity ?? "—"],
            ["Largest loss", summary.plannedMaxLossAmount ? inr(Number(summary.plannedMaxLossAmount)) : "—"], ["Reward to risk", summary.riskReward ? `1 : ${summary.riskReward}` : "—"],
            ["Status", summary.effectiveStatus.replaceAll("_", " ").toLowerCase()], ["Why", summary.reasonCode ? words(summary.reasonCode) : "—"],
          ]} />
        </section>
      ) : null}
      {state.kind === "loading" ? <Skeleton h={240} /> : state.kind === "none" ? <Empty title="No research assessment stored for this decision" hint="The agent engine runs in shadow mode, which logs results without storing them. A stored assessment appears here once the engine records one." /> : state.kind === "unreadable" ? <Empty title="The stored assessment could not be read" hint="It exists but is malformed, so nothing is shown rather than a guess." /> : state.kind === "error" ? <Empty title="The card could not be loaded" hint="See the banner above for the cause. The page retries by itself." /> : <CardView c={state.card} />}
    </div>
  );
}

function CardView({ c }: { c: DecisionCardData }) {
  const reduce = useReducedMotion();
  const total = c.agents.filter((a) => a.scored).reduce((s, a) => s + a.weight * ((a.confidence ?? 0) / 100), 0);
  const side = (v: string): "for" | "against" | "neutral" => (v === "SUPPORTIVE" ? "for" : v === "NEUTRAL" ? "neutral" : "against");
  const share = (k: "for" | "against" | "neutral"): number => (total === 0 ? 0 : (c.agents.filter((a) => a.scored && side(a.verdict) === k).reduce((s, a) => s + a.weight * ((a.confidence ?? 0) / 100), 0) / total) * 100);
  return (
    <>
      <section className={cn(card, "p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{ASSESSMENT_TEXT[c.headline.assessment] ?? c.headline.assessment.replaceAll("_", " ").toLowerCase()}</h2>
          <span className="text-xs text-slate-500">decided by {words(c.headline.decidedBy)}{c.headline.score !== null ? ` · score ${c.headline.score}` : ""}{c.decisionVersion !== null ? ` · decision v${c.decisionVersion}` : ""}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{c.headline.halts ? "The flow stops here: " : "The flow continues: "}{c.headline.haltReason || "no reason recorded"}</p>
        {total > 0 ? (
          <div className="mt-4" role="img" aria-label={`For ${share("for").toFixed(0)} percent, neutral ${share("neutral").toFixed(0)} percent, against ${share("against").toFixed(0)} percent`}>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">{([["for", "bg-emerald-500"], ["neutral", "bg-slate-300"], ["against", "bg-rose-500"]] as const).map(([k, cls]) => <motion.i key={k} className={cls} initial={reduce ? false : { width: 0 }} animate={{ width: `${share(k)}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />)}</div>
            <p className="mt-1 text-xs text-slate-500">For {share("for").toFixed(0)}% · neutral {share("neutral").toFixed(0)}% · against {share("against").toFixed(0)}% (weight x confidence of scoring agents)</p>
          </div>
        ) : null}
      </section>

      <section className={cn(card, "overflow-hidden")}>
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-semibold text-ink">What each agent said</h2></div>
        {c.agents.length === 0 ? <div className="p-5"><Empty title="No agent results" hint="Nothing was recorded for this run." /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Agent</th><th className="px-3 py-3">View</th><th className="px-3 py-3">Confidence</th><th className="px-3 py-3">Reasons</th></tr></thead>
            <tbody>{c.agents.map((a) => (
              <tr key={a.agentId} className="border-t border-slate-50 align-top"><td className="px-5 py-3 font-mono text-[13px] text-ink">{a.agentId}{a.required ? <span className="ml-2 text-[10px] text-slate-400">required</span> : null}</td>
                <td className="px-3 py-3"><Chip kind={VERDICT_KIND[a.verdict] ?? "CLOSED"}>{a.status === "COMPLETED" ? a.verdict.toLowerCase() : a.status.toLowerCase()}</Chip></td>
                <td className="px-3 py-3 font-mono text-xs">{a.confidence === null ? "—" : `${a.confidence}%`}</td>
                <td className="px-3 py-3 font-mono text-xs text-slate-600">{a.reasonCodes.length ? a.reasonCodes.join(", ") : a.errorCode ?? "—"}</td></tr>))}</tbody></table></div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={cn(card, "p-5")}>
          <h2 className="text-base font-semibold text-ink">Blocking this</h2>
          {c.blockers.length === 0 && c.unavailable.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nothing recorded as blocking.</p> : (
            <ul className="mt-2 space-y-2 text-sm">
              {c.blockers.map((b) => <li key={b.agentId}><Chip kind="REJECTED">blocked</Chip> <span className="font-mono text-xs">{b.agentId}: {b.findingCodes.join(", ") || "no code"}</span></li>)}
              {c.unavailable.map((u) => <li key={u.agentId}><Chip kind="CANCELLED">no result</Chip> <span className="font-mono text-xs">{u.agentId}: {u.errorCode ?? u.status.toLowerCase()}{u.required ? " (required)" : ""}</span></li>)}
            </ul>
          )}
        </section>
        <section className={cn(card, "p-5")}>
          <h2 className="text-base font-semibold text-ink">Close calls</h2>
          {c.closeCalls.length === 0 ? <p className="mt-2 text-sm text-slate-500">No rule was decided by a small margin.</p> : (
            <ul className="mt-2 space-y-2 text-sm">{c.closeCalls.map((k) => <li key={k.rule} className="font-mono text-xs text-slate-700">{words(k.rule)}: value {k.value}, threshold {k.threshold} ({k.met ? "met" : "not met"} by {k.margin})</li>)}</ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={cn(card, "p-5")}>
          <h2 className="text-base font-semibold text-ink">Size</h2>
          {c.sizing === null ? <p className="mt-2 text-sm text-slate-500">No sizing information for this decision.</p> : (
            <KV rows={[["Status", c.sizing.status.toLowerCase()], ["Reason", c.sizing.reasonCode ? words(c.sizing.reasonCode) : "—"], ["Quantity", String(c.sizing.quantity)], ["Largest loss", c.sizing.maxLossPercent === null ? "—" : `${c.sizing.maxLossPercent}% of capital`], ["Reward to risk", c.sizing.riskReward === null ? "—" : `1 : ${c.sizing.riskReward}`], ["Source trust", c.sizing.trustTier ? c.sizing.trustTier.replace("TIER_", "tier ").toLowerCase() : "unknown"]]} />
          )}
        </section>
        <section className={cn(card, "p-5")}>
          <h2 className="text-base font-semibold text-ink">Data behind it</h2>
          {c.sourceHealth === null ? <p className="mt-2 text-sm text-slate-500">Source health was not recorded.</p> : (
            <div className="mt-2 text-sm"><p className="flex items-center gap-2"><Dot tone={c.sourceHealth.overall === "OK" ? "ok" : c.sourceHealth.overall === "MISSING" ? "off" : "warn"} /> Overall: {c.sourceHealth.overall.toLowerCase()}</p>
              {c.sourceHealth.notUsable.length > 0 ? <ul className="mt-2 space-y-1">{c.sourceHealth.notUsable.map((p) => <li key={p.provider} className="font-mono text-xs text-slate-600">{p.provider}: {p.status.toLowerCase()}{p.reasons.length ? ` (${p.reasons.map(words).join(", ")})` : ""}</li>)}</ul> : <p className="mt-1 text-xs text-slate-500">Every source was usable.</p>}</div>
          )}
        </section>
      </div>

      {c.statements.length > 0 ? <section className={cn(card, "p-5")}><h2 className="text-base font-semibold text-ink">Read this as</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{c.statements.map((s) => <li key={s}>{s}</li>)}</ul></section> : null}

      <ActionsBar id={c.riskDecisionId} />
    </>
  );
}

const BOT = process.env.NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL ?? "";
const BOT_OK = /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}$/.test(BOT);

/** Approve / Reject stay disabled: approval is made in the Telegram bot (owner decision, Option A). The deep link is enabled only when the bot's address is configured at build time. */
function ActionsBar({ id }: { id: string }) {
  const { toast } = useToast();
  const copy = async (): Promise<void> => {
    try { await navigator.clipboard.writeText(id); toast("Decision id copied. Paste it in the approval bot if it asks for one.", "success"); } catch { toast("Could not copy. Select the id on the page instead.", "warn"); }
  };
  return (
    <section className={cn(card, "flex flex-wrap items-center gap-3 bg-slate-50 p-5")} aria-label="Actions">
      <Tip text="Approval is made in the Telegram approval bot after every gate is re-checked."><button type="button" disabled className="cursor-not-allowed rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400">Reject</button></Tip>
      <Tip text="Approval is made in the Telegram approval bot after every gate is re-checked."><button type="button" disabled className="cursor-not-allowed rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400">Approve for review</button></Tip>
      {BOT_OK ? (
        <a href={BOT} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-royal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500"><Send className="h-4 w-4" aria-hidden />Open the approval bot in Telegram</a>
      ) : (
        <Tip text="The bot's address is not configured for this frontend (NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL)."><button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400"><Send className="h-4 w-4" aria-hidden />Open in Telegram</button></Tip>
      )}
      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-royal-300 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500"><Copy className="h-4 w-4" aria-hidden />Copy decision id</button>
      <p className="min-w-[16rem] flex-1 text-xs text-slate-500">Approval is not available on this page. It is made in the Telegram approval bot after every gate is re-checked.</p>
    </section>
  );
}
