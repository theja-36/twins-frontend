"use client";
import React from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Layers, List, Send } from "lucide-react";
import type { ApprovalSummary, DecisionCardData, DecisionSummary } from "@/types/trading";
import { arr, obj, useRead } from "./data";
import { BOT_LINK } from "./botLink";
import { Chip, Disclosure, FilterGroup, ReadGate, Sheet, Table } from "./kit";
import { ASSESSMENT_TEXT, STATUS_LABEL, agentShares, approvalFor, ageSince, ageText, decisionStop, decisionTitle, istTime, liveDecisions, num, rupees, statusGroup, words, type StatusGroup, type Tone } from "./model";

const FILTERS = [["all", "All"], ["pending", "Pending"], ["ready", "Approved for review"], ["rejected", "Rejected"], ["expired", "Expired"]] as const;
const SWIPE_PX = 90, SWIPE_VELOCITY = 500, BEHIND = 3;
const VERDICT: Record<string, Tone> = { SUPPORTIVE: "ok", NEUTRAL: "mute", CAUTION: "warn", ADVERSE: "bad", BLOCKING: "bad", UNAVAILABLE: "mute" };
const REASON = "Approval is made in the Telegram approval bot after every gate is re-checked.";

export function Ladder({ stop, entry, targets }: { stop: number | null; entry: number | null; targets: number[] }) {
  const vals = [stop, entry, ...targets].filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi - lo), pos = (v: number): string => `${6 + ((v - lo) / span) * 88}%`;
  return (
    <div className="st-ladder" role="img" aria-label={`Levels to scale: ${stop !== null ? `stop ${stop}, ` : "no stop, "}${entry !== null ? `entry ${entry}, ` : ""}targets ${targets.join(", ") || "none"}`}>
      {stop !== null ? <i className="s" style={{ left: pos(stop) }} /> : null}{entry !== null ? <i className="e" style={{ left: pos(entry) }} /> : null}{targets.map((t) => <i key={t} className="t" style={{ left: pos(t) }} />)}
    </div>
  );
}
export function Levels({ stop, entry, targets, entryKind }: { stop: number | null; entry: number | null; targets: number[]; entryKind?: string }) {
  return (
    <div className="st-levels"><Ladder stop={stop} entry={entry} targets={targets} />
      <div className="st-levelnums num">
        <div><small><i className="s" />Stop</small><strong style={{ color: stop === null ? "var(--bad)" : undefined }}>{stop ?? "none"}</strong></div>
        <div><small><i className="e" />Entry</small><strong>{entry ?? "—"}{entryKind ? <em>{entryKind}</em> : null}</strong></div>
        {targets.slice(0, 2).map((t, i) => <div key={i}><small><i className="t" />T{i + 1}</small><strong>{t}</strong></div>)}
      </div>
      {targets.length > 2 ? <p className="st-sub" style={{ margin: "8px 0 0" }}>More targets: {targets.slice(2).join(", ")}</p> : null}
    </div>
  );
}

/** Decisions page: deck and list over the same loaded records. Navigation never approves, rejects or dismisses anything. */
export function DecisionsView() {
  const dec = useRead<DecisionSummary[]>("risk/decisions?limit=100", arr<"decisions", DecisionSummary>("decisions"));
  const apr = useRead<ApprovalSummary[]>("risk/approvals?limit=100", arr<"approvals", ApprovalSummary>("approvals"));
  return (
    <ReadGate read={dec} what="decisions" isEmpty={(d) => liveDecisions(d).length === 0} emptyHint="New decisions appear here after a Telegram signal passes intake and the risk rules run.">
      {(d) => <DeckBody rows={liveDecisions(d)} approvals={apr.data ?? []} approvalsKnown={apr.status === "ok"} />}
    </ReadGate>
  );
}

function DeckBody({ rows, approvals, approvalsKnown }: { rows: DecisionSummary[]; approvals: ApprovalSummary[]; approvalsKnown: boolean }) {
  const reduce = useReducedMotion();
  const [view, setView] = React.useState<"deck" | "list">("deck");
  const [filter, setFilter] = React.useState<"all" | StatusGroup>("all");
  const [i, setI] = React.useState(0);
  const [open, setOpen] = React.useState<DecisionSummary | null>(null);
  const list = rows.filter((d) => filter === "all" || statusGroup(d.effectiveStatus) === filter);
  const n = list.length;
  React.useEffect(() => setI(0), [filter]);
  const go = React.useCallback((d: number): void => setI((c) => Math.min(Math.max(0, n - 1), Math.max(0, c + d))), [n]);
  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); setI(0); } else if (e.key === "End") { e.preventDefault(); setI(n - 1); }
    else if (e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); setOpen(list[i] ?? null); }
  };
  const cur = list[i];
  const appr = (d: DecisionSummary) => (approvalsKnown ? approvalFor(d, approvals) : { label: "Approval ledger not readable", tone: "mute" as Tone });
  return (
    <div className="st-stack" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="st-seg" role="group" aria-label="View">
          <button aria-pressed={view === "deck"} onClick={() => setView("deck")}><Layers size={16} aria-hidden />Deck</button>
          <button aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} aria-hidden />List</button>
        </div>
        <span className="st-chip mute">{n} of {rows.length} loaded decisions</span>
      </div>
      <FilterGroup label="Status" options={FILTERS} value={filter} onChange={setFilter} />
      {n === 0 ? <div className="st-empty"><h3>No decisions match this filter</h3><p>Choose another status. This is an empty result, not an error.</p></div> : view === "deck" ? (
        <div className="st-deckwrap">
          <div>
            <div className="st-stage" tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Decision deck. Left and right arrow keys move between cards. Enter opens the full analysis." onKeyDown={onKey}>
              {list.map((d, idx) => { const off = idx - i; return off < 0 || off > BEHIND ? null : <DeckCard key={d.id} d={d} off={off} reduce={!!reduce} count={`${idx + 1} of ${n}`} approval={appr(d)} onGo={go} onOpen={() => setOpen(d)} />; })}
            </div>
            <div className="st-controls">
              <button className="st-iconbtn" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous decision" style={{ opacity: i === 0 ? 0.4 : 1 }}><ChevronLeft aria-hidden /></button>
              <div className="st-dots" role="group" aria-label="Pick a decision">{list.map((d, k) => <button key={d.id} aria-current={k === i} aria-label={`Decision ${k + 1}: ${decisionTitle(d)}`} onClick={() => setI(k)} />)}</div>
              <button className="st-iconbtn" onClick={() => go(1)} disabled={i === n - 1} aria-label="Next decision" style={{ opacity: i === n - 1 ? 0.4 : 1 }}><ChevronRight aria-hidden /></button>
            </div>
            <p className="st-hint" aria-live="polite">{cur ? `${i + 1} of ${n}: ${decisionTitle(cur)}. ` : ""}Swipe, drag or use the arrows. Navigating never approves or dismisses anything.</p>
          </div>
          <aside className="st-card" aria-label="Up next"><h2>Up next</h2><p className="st-sub">Jump straight to a card.</p>
            <ul className="st-list">{list.map((d, k) => (
              <li key={d.id} className="st-row"><button className="st-link grow" onClick={() => setI(k)} aria-current={k === i}><span className="t" style={{ display: "block", color: k === i ? undefined : "var(--ink)" }}>{decisionTitle(d)}</span><span className="s" style={{ fontWeight: 500 }}>{ageText(ageSince(d.createdAt, Date.now())).replace(" old", " ago")}</span></button><Chip tone={STATUS_LABEL[statusGroup(d.effectiveStatus)].tone}>{STATUS_LABEL[statusGroup(d.effectiveStatus)].label}</Chip></li>))}</ul></aside>
        </div>
      ) : (
        <div className="st-card"><Table caption="Decisions" rows={list} rowKey={(d) => d.id} onRow={setOpen} cols={[
          { key: "i", label: "Instrument", render: (d) => <><button className="st-link" onClick={(e) => { e.stopPropagation(); setOpen(d); }}>{decisionTitle(d)}</button><div className="st-sub" style={{ margin: 0, fontSize: 12 }}>{d.expiry ?? "no expiry"}</div></> },
          { key: "s", label: "Side", render: (d) => d.side ?? "—" },
          { key: "st", label: "Status", render: (d) => <Chip tone={STATUS_LABEL[statusGroup(d.effectiveStatus)].tone}>{STATUS_LABEL[statusGroup(d.effectiveStatus)].label}</Chip> },
          { key: "l", label: "Entry / Stop", className: "num", render: (d) => `${d.entryPrice ?? "—"} / ${d.stopLoss ?? "—"}` },
          { key: "q", label: "Stop quality", render: (d) => <Chip tone={decisionStop(d).tone}>{decisionStop(d).label}</Chip> },
          { key: "a", label: "Approval", render: (d) => appr(d).label },
          { key: "t", label: "Evaluated", className: "num", render: (d) => `${istTime(d.createdAt)} IST` },
        ]} /></div>
      )}
      <DecisionSheet d={open} approval={open ? appr(open) : null} onClose={() => setOpen(null)} />
    </div>
  );
}

function DeckCard({ d, off, reduce, count, approval, onGo, onOpen }: { d: DecisionSummary; off: number; reduce: boolean; count: string; approval: { label: string }; onGo: (n: number) => void; onOpen: () => void }) {
  const x = useMotionValue(0);
  const active = off === 0;
  const tilt = off === 0 ? 0 : (off % 2 === 0 ? 1 : -1) * (1.2 + off * 0.5);
  const onEnd = (_: unknown, info: PanInfo): void => {
    const dir = info.offset.x < -SWIPE_PX || info.velocity.x < -SWIPE_VELOCITY ? 1 : info.offset.x > SWIPE_PX || info.velocity.x > SWIPE_VELOCITY ? -1 : 0;
    if (dir !== 0) onGo(dir);
    animate(x, 0, reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 });
  };
  const g = statusGroup(d.effectiveStatus), stop = decisionStop(d), age = ageSince(d.createdAt, Date.now());
  const qty = num(d.plannedQuantity), loss = num(d.plannedMaxLossAmount);
  return (
    <motion.article className={`st-deckcard${active ? "" : " back"}`} data-active={active} aria-hidden={!active} aria-label={active ? `${decisionTitle(d)}, ${count}` : undefined}
      style={{ x: active ? x : 0, zIndex: 10 - off }} initial={false} animate={{ y: off * 14, scale: 1 - off * 0.045, rotate: tilt, opacity: 1 - off * 0.16 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }} drag={active ? "x" : false} dragElastic={0.5} dragConstraints={{ left: 0, right: 0 }} onDragEnd={active ? onEnd : undefined}>
      {active ? (
        <>
          <div className="st-cardhead">
            <div><h3>{decisionTitle(d)}</h3><div className="st-meta"><Chip tone={d.side === "BUY" ? "ok" : d.side === "SELL" ? "bad" : "mute"}>{d.side ?? "side n/a"}</Chip><Chip tone="info">Telegram · {d.subjectKind === "options_claim" ? "options claim" : "signal"}</Chip><Chip tone={STATUS_LABEL[g].tone}>{STATUS_LABEL[g].label}</Chip></div></div>
            <div className="st-time-r num">{istTime(d.createdAt)} IST<br /><span>{ageText(age).replace(" old", " ago")}</span></div>
          </div>
          <Levels stop={num(d.stopLoss)} entry={num(d.entryPrice)} targets={d.targets.map(Number).filter(Number.isFinite)} />
          <p className="st-why">{d.reasonCode ? `Reason on record: ${words(d.reasonCode)}.` : "No reason recorded."}</p>
          <div className="st-facts">
            <div className="st-fact"><b>Stop quality</b><Chip tone={stop.tone}>{stop.label}</Chip></div>
            <div className="st-fact"><b>Main blocker</b><strong>{g === "ready" ? "None recorded" : words(d.reasonCode || "none recorded")}</strong></div>
            <div className="st-fact"><b>Proposed size</b>{qty !== null ? <strong>{qty} qty · max loss {rupees(loss)}</strong> : <strong>Not sized</strong>}</div>
            <div className="st-fact"><b>Approval</b><strong>{approval.label}</strong></div>
            <div className="st-fact" style={{ gridColumn: "1 / -1" }}><b>Decision age</b>Evaluated {ageText(age).replace(" old", " ago")}. Market-data health is in the full analysis.</div>
          </div>
          <div className="st-cardfoot">
            <button className="st-btn" onClick={onOpen} onPointerDownCapture={(e) => e.stopPropagation()}>Full analysis</button>
            <span style={{ display: "flex", gap: 8 }}><button className="st-btn ghost" disabled title={REASON}>Approve</button><button className="st-btn ghost" disabled title={REASON}>Reject</button></span>
          </div>
        </>
      ) : null}
    </motion.article>
  );
}

function DecisionSheet({ d, approval, onClose }: { d: DecisionSummary | null; approval: { label: string } | null; onClose: () => void }) {
  const card = useRead<DecisionCardData>(d ? `risk/decisions/${d.id}/decision-card` : null, obj<DecisionCardData>("agents"), 60_000);
  const [copied, setCopied] = React.useState<"" | "ok" | "fail">("");
  React.useEffect(() => setCopied(""), [d?.id]);
  const copy = async (): Promise<void> => { if (!d) return; try { await navigator.clipboard.writeText(d.id); setCopied("ok"); } catch { setCopied("fail"); } };
  if (!d) return null;
  const g = statusGroup(d.effectiveStatus), stop = decisionStop(d), c = card.data, sh = c ? agentShares(c) : null;
  return (
    <Sheet open onClose={onClose} titleId="st-dec-title">
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}><Chip tone={STATUS_LABEL[g].tone}>{STATUS_LABEL[g].label}</Chip><Chip tone="info">Telegram</Chip>{d.market ? <Chip tone="mute">{d.market}</Chip> : null}<Chip tone={stop.tone}>{stop.label}</Chip></div>
        <h2 id="st-dec-title" style={{ margin: 0 }}>{decisionTitle(d)} · {d.side ?? "—"}</h2>
        <p className="st-sub" style={{ margin: "6px 0 0" }}>{d.expiry ?? "Expiry not given"} · evaluated {istTime(d.createdAt)} IST · {approval?.label}</p>
      </div>
      <Levels stop={num(d.stopLoss)} entry={num(d.entryPrice)} targets={d.targets.map(Number).filter(Number.isFinite)} />
      <section><h4>Headline and thesis</h4>
        {card.status === "ok" && c ? <>
          <p className="st-why"><strong>{ASSESSMENT_TEXT[c.headline.assessment] ?? words(c.headline.assessment)}</strong> · decided by {words(c.headline.decidedBy)}{c.headline.score !== null ? ` · score ${c.headline.score}` : ""}</p>
          <p className="st-sub" style={{ margin: "6px 0 0" }}>{c.headline.halts ? "The flow stops here: " : "The flow continues: "}{c.headline.haltReason || "no reason recorded"}</p>
          {c.statements.length ? <ul className="st-sub" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{c.statements.map((s) => <li key={s}>{s}</li>)}</ul> : null}
        </> : <ReadGate read={card} what="the research assessment" unavailableHint="No research assessment is stored for this decision. The agent engine runs in shadow mode, which logs results without storing them for the app.">{() => null}</ReadGate>}
      </section>
      {c ? <section><h4>Bull, neutral, bear</h4>{sh ? (
        <div role="img" aria-label={`Bull ${sh.bull.toFixed(0)} percent, neutral ${sh.neutral.toFixed(0)} percent, bear ${sh.bear.toFixed(0)} percent`}>
          <div className="st-bull"><i className="b" style={{ width: `${sh.bull}%` }} /><i className="n" style={{ width: `${sh.neutral}%` }} /><i className="r" style={{ width: `${sh.bear}%` }} /></div>
          <div className="st-legend"><span>Bull <b>{sh.bull.toFixed(0)}%</b></span><span>Neutral <b>{sh.neutral.toFixed(0)}%</b></span><span>Bear <b>{sh.bear.toFixed(0)}%</b></span><span>(weight x confidence of scoring agents)</span></div></div>
      ) : <p className="st-sub" style={{ margin: 0 }}>No agent produced a scored view, so there is no split.</p>}</section> : null}
      <section><h4>Proposed size</h4>
        <div className="st-kv num"><div>Quantity<strong>{d.plannedQuantity ?? "—"}</strong></div><div>Notional<strong>{rupees(num(d.plannedNotional))}</strong></div><div>Largest loss<strong>{rupees(num(d.plannedMaxLossAmount))}</strong></div><div>Reward to risk<strong>{d.riskReward ? `1 : ${d.riskReward}` : "—"}</strong></div>
          <div>Sizing status<strong>{c?.sizing ? words(c.sizing.status) : num(d.plannedQuantity) !== null ? "sized" : "not sized"}</strong></div><div>Trust tier<strong>{d.sourceTrustTier ?? c?.sizing?.trustTier ?? "UNKNOWN"}</strong></div></div>
        {c?.sizing?.reasonCode ? <p className="st-sub" style={{ margin: "8px 0 0" }}>Reason: {words(c.sizing.reasonCode)}</p> : null}</section>
      <section><h4>What is holding it back</h4>
        {g === "ready" && !c?.blockers.length ? <p className="st-sub" style={{ margin: 0 }}>Nothing recorded as blocking.</p> : <div className="st-stack" style={{ gap: 8 }}>
          {d.reasonCode && g !== "ready" ? <div className="st-agent" style={{ borderTop: 0, padding: 0 }}><Chip tone="warn">reason</Chip><span style={{ fontSize: 13.5, fontWeight: 600 }}>{words(d.reasonCode)}</span></div> : null}
          {c?.blockers.map((b) => <div key={b.agentId} className="st-agent" style={{ borderTop: 0, padding: 0, flexWrap: "wrap" }}><Chip tone="bad">{b.agentId}</Chip><span style={{ fontSize: 13, fontWeight: 600 }}>{b.findingCodes.map(words).join(", ")}</span></div>)}
          {c?.unavailable.map((u) => <div key={u.agentId} className="st-agent" style={{ borderTop: 0, padding: 0 }}><Chip tone="mute">unavailable</Chip><span style={{ fontSize: 13 }}>{u.agentId}{u.required ? " (required)" : ""}{u.errorCode ? `: ${words(u.errorCode)}` : ""}</span></div>)}</div>}</section>
      {c ? <section><h4>Close calls</h4>{c.closeCalls.length === 0 ? <p className="st-sub" style={{ margin: 0 }}>No rule was close to its threshold.</p> : (
        <div className="st-tablewrap"><table className="st-table st-mini-table"><thead><tr><th>Rule</th><th>Threshold</th><th>Value</th><th>Met</th><th>Margin</th></tr></thead>
          <tbody>{c.closeCalls.map((k) => <tr key={k.rule}><td data-label="Rule">{words(k.rule)}</td><td data-label="Threshold" className="num">{k.threshold}</td><td data-label="Value" className="num">{k.value}</td><td data-label="Met"><Chip tone={k.met ? "ok" : "bad"}>{k.met ? "met" : "not met"}</Chip></td><td data-label="Margin" className="num">{k.margin}</td></tr>)}</tbody></table></div>)}</section> : null}
      <section><h4>Data health</h4>
        {c?.sourceHealth ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip tone={c.sourceHealth.overall === "OK" ? "ok" : "warn"}>Overall: {c.sourceHealth.overall.toLowerCase()}</Chip>{c.sourceHealth.notUsable.map((n) => <Chip key={n.provider} tone="mute" title={n.reasons.join("; ")}>{n.provider}: {n.status.toLowerCase()}</Chip>)}</div> : <p className="st-sub" style={{ margin: 0 }}>Source health was not recorded with this assessment.</p>}</section>
      {c ? <Disclosure label="What each check said">{c.agents.map((a) => <div key={a.agentId} className="st-agent" style={{ flexWrap: "wrap" }}><Chip tone={VERDICT[a.verdict] ?? "mute"}>{a.status === "COMPLETED" ? a.verdict.toLowerCase() : a.status.toLowerCase()}</Chip><span style={{ fontWeight: 700, fontSize: 13.5 }}>{a.agentId}</span><span className="st-sub" style={{ margin: 0, marginLeft: "auto" }}>{a.confidence === null ? "not scored" : `${a.confidence}%`} · weight {a.weight}</span>{a.reasonCodes.length || a.errorCode ? <span className="st-sub st-mono" style={{ margin: 0, width: "100%" }}>{a.reasonCodes.join(", ") || a.errorCode}</span> : null}</div>)}</Disclosure> : null}
      <section className="st-note">{REASON} The web app only reads.
        <div className="st-actions" style={{ marginTop: 10 }}>
          <button className="st-btn ghost" disabled title={REASON}>Reject</button><button className="st-btn ghost" disabled title={REASON}>Approve for review</button>
          {BOT_LINK ? <a className="st-btn" href={BOT_LINK} target="_blank" rel="noopener noreferrer"><Send size={15} aria-hidden />Open the approval bot in Telegram</a> : <button className="st-btn ghost" disabled title="The bot address is not configured for this frontend (NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL)."><Send size={15} aria-hidden />Open in Telegram · not configured</button>}
          <button className="st-btn ghost" onClick={() => void copy()}><Copy size={15} aria-hidden />Copy decision id</button></div>
        <p className="st-sub" style={{ margin: "8px 0 0" }} role="status">{copied === "ok" ? "Decision id copied." : copied === "fail" ? `Could not copy. Select the id instead: ${d.id}` : "The bot link opens the bot only. It does not open this decision."}</p></section>
    </Sheet>
  );
}
