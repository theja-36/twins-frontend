"use client";
import React from "react";
import { Plus, Send } from "lucide-react";
import type { TelegramChannel, TelegramClaim } from "@/types/trading";
import { blockerText, entryText, expiryText } from "@/lib/channels";
import { claimTitle, stopQuality } from "@/lib/claims";
import { arr, useRead } from "./data";
import { Ladder, Levels } from "./decisions";
import { Card, Chip, Disclosure, FilterGroup, ReadGate, Sheet, Table } from "./kit";
import { NO_CLAIM_FILTERS, activeFilterCount, applyClaimFilters, marketOf, type ClaimFilters, type Tone } from "./model";

export const QTONE: Record<string, Tone> = { good: "ok", caution: "warn", poor: "bad", none: "bad" };
const AGE = [[null, "Any time"], [1, "Last hour"], [24, "Last 24 h"]] as const;

export function ClaimSheet({ c, onClose }: { c: TelegramClaim | null; onClose: () => void }) {
  if (!c) return null;
  const q = stopQuality(c.claim), cl = c.claim;
  return (
    <Sheet open onClose={onClose} titleId="st-claim-title">
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}><Chip tone="info">Telegram · {c.channel}</Chip><Chip tone="mute">{marketOf(cl?.underlying ?? null)}</Chip><Chip tone={QTONE[q.level] ?? "mute"}>{q.label}</Chip>{cl?.levelBasisInferred ? <Chip tone="info">Premium inferred</Chip> : null}{c.resultKind && c.resultKind !== "claim" ? <Chip tone="warn">{c.resultKind}</Chip> : null}</div>
        <h2 id="st-claim-title" style={{ margin: 0 }}>{claimTitle(cl)}{cl?.action ? ` · ${cl.action.toUpperCase()}` : ""}</h2>
        <p className="st-sub" style={{ margin: "6px 0 0" }}>{cl ? expiryText(cl.expiry) : "no claim"} · parsed by {c.parserVersion}</p>
      </div>
      {cl ? <Levels stop={cl.stopLoss} entry={cl.entry.price} targets={cl.targets} entryKind={cl.entry.type ?? undefined} /> : <p className="st-sub">The message did not parse into a full claim.</p>}
      <section><h4>Stop-loss quality</h4><p className="st-sub" style={{ margin: 0 }}><Chip tone={QTONE[q.level] ?? "mute"}>{q.label}</Chip> {q.detail}{q.pctOfStrike !== null ? ` (stop is ${q.pctOfStrike}% of the strike)` : ""}</p></section>
      <section><h4>What blocks it</h4>{c.blockers.length === 0 ? <p className="st-sub" style={{ margin: 0 }}>Nothing recorded as blocking.</p> : <div className="st-stack" style={{ gap: 8 }}>{c.blockers.map((b) => <div key={b.code} className="st-agent" style={{ borderTop: 0, padding: 0 }}><Chip tone={b.severity === "blocking" ? "bad" : "warn"}>{b.severity}</Chip><span style={{ fontSize: 13.5, fontWeight: 600 }}>{blockerText(b.code)}</span></div>)}</div>}</section>
      <section><h4>Assessment</h4><p className="st-sub" style={{ margin: 0 }}>{c.assessmentOutcome ? (c.assessmentOutcome === "REJECT" ? "Rejected by the rules." : "Insufficient evidence to go further.") : "No assessment recorded."}</p></section>
      <Disclosure label="Details">
        <div className="st-kv"><div>Entry<strong>{cl ? entryText(cl.entry) : "—"}</strong></div><div>Targets<strong>{cl?.targets.join(" / ") || "—"}</strong></div><div>Level basis<strong>{cl?.levelBasis ?? "not stated"}</strong></div><div>Received<strong>{c.receivedAt ? new Date(c.receivedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</strong></div></div>
        <p className="st-sub" style={{ margin: "10px 0 0" }}>Related decision: the API does not link a parsed claim to its risk decision, so none is shown. Open Decisions to browse them separately. Message text is never shown.</p>
      </Disclosure>
    </Sheet>
  );
}

export function claimCols(onOpen: (c: TelegramClaim) => void) {
  return [
    { key: "c", label: "Contract", render: (r: TelegramClaim) => <button className="st-link" onClick={(e) => { e.stopPropagation(); onOpen(r); }}>{claimTitle(r.claim)}</button> },
    { key: "a", label: "Action", render: (r: TelegramClaim) => (r.claim?.action ? r.claim.action.toUpperCase() : "—") },
    { key: "e", label: "Entry", className: "num", render: (r: TelegramClaim) => (r.claim ? entryText(r.claim.entry) : "—") },
    { key: "s", label: "Stop", render: (r: TelegramClaim) => { const q = stopQuality(r.claim); return <><span className="num">{r.claim?.stopLoss ?? "—"}</span> <Chip tone={QTONE[q.level] ?? "mute"}>{q.label}</Chip></>; } },
    { key: "t", label: "Targets", className: "num", render: (r: TelegramClaim) => r.claim?.targets.join(" / ") || "—" },
    { key: "x", label: "Expiry", render: (r: TelegramClaim) => (r.claim ? expiryText(r.claim.expiry) : "—") },
    { key: "ch", label: "Channel", render: (r: TelegramClaim) => r.channel },
    { key: "b", label: "Blockers", render: (r: TelegramClaim) => (r.blockers.length ? <Chip tone="mute">{blockerText(r.blockers[0]?.code ?? "")}{r.blockers.length > 1 ? ` +${r.blockers.length - 1}` : ""}</Chip> : "none") },
  ];
}

export function SignalsView() {
  const claims = useRead<TelegramClaim[]>("telegram/claims?limit=100", arr<"claims", TelegramClaim>("claims"));
  const [f, setF] = React.useState<ClaimFilters>(NO_CLAIM_FILTERS);
  const [open, setOpen] = React.useState<TelegramClaim | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [fOpen, setFOpen] = React.useState<boolean | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => { const m = window.matchMedia("(max-width:860px)"); const g = (): void => setNarrow(m.matches); g(); m.addEventListener("change", g); return () => m.removeEventListener("change", g); }, []);
  React.useEffect(() => { if (location.hash === "#add-channel") setAdding(true); }, []);
  const set = <K extends keyof ClaimFilters>(k: K, v: ClaimFilters[K]): void => setF((p) => ({ ...p, [k]: v }));
  const act = activeFilterCount(f);
  return (
    <>
      <div className="st-filters" role="group" aria-label="Origin">
        <button className="st-fbtn" aria-pressed="true"><Send size={14} aria-hidden />Telegram</button>
        <button className="st-fbtn" disabled title="Not built: the system does not generate signals today">System-generated · not available</button>
        <span style={{ flex: 1 }} /><button className="st-btn ghost" onClick={() => setAdding(true)}><Plus size={16} aria-hidden />Add Telegram channel</button>
      </div>
      <ReadGate read={claims} what="parsed claims" isEmpty={(d) => d.length === 0} emptyHint="Parsed claims appear here after a captured channel message is read by the parser.">
        {(all) => {
          const channels = [...new Set(all.map((c) => c.channel))];
          const rows = applyClaimFilters(all, f);
          return (
            <>
              <details className="st-disc st-fdisc" open={fOpen ?? !narrow} onToggle={(e) => setFOpen((e.currentTarget as HTMLDetailsElement).open)}>
                <summary>Filters{act ? ` · ${act} active` : ""}</summary>
                <div className="st-discbody st-stack" style={{ gap: 10 }}>
                  <FilterGroup label="Channel" options={[["all", "All channels"], ...channels.map((c) => [c, c] as const)]} value={f.channel} onChange={(v) => set("channel", v)} />
                  <FilterGroup label="Market" options={[["all", "All markets"], ["NSE", "NSE"], ["BSE", "BSE"]] as const} value={f.market} onChange={(v) => set("market", v)} />
                  <FilterGroup label="Side" options={[["all", "Any side"], ["buy", "Buy"], ["sell", "Sell"], ["none", "No action given"]] as const} value={f.side} onChange={(v) => set("side", v)} />
                  <FilterGroup label="Assessment" options={[["all", "Any assessment"], ["INSUFFICIENT_EVIDENCE", "Insufficient evidence"], ["REJECT", "Rejected"]] as const} value={f.outcome} onChange={(v) => set("outcome", v)} />
                  <FilterGroup label="Time" options={AGE.map(([k, l]) => [String(k), l] as const)} value={String(f.sinceHours)} onChange={(v) => set("sinceHours", v === "null" ? null : Number(v))} />
                  <label className="st-check"><input type="checkbox" checked={f.completeOnly} onChange={(e) => set("completeOnly", e.target.checked)} />Complete claims only (action and entry stated)</label>
                  <p className="st-sub" style={{ margin: 0 }}>These filters work on the {all.length} loaded records only (the latest 100). They are not a search of the full history, and the market is derived from the index name.</p>
                </div></details>
              <p className="st-chip mute" style={{ alignSelf: "flex-start" }}>{rows.length} of {all.length} loaded claims</p>
              {rows.length === 0 ? <div className="st-empty"><h3>No claims match these filters</h3><p>Loosen a filter. This is an empty filter result, not an error.</p></div> : <div className="st-card"><Table caption="Parsed claims" rows={rows} rowKey={(r) => r.id} onRow={setOpen} cols={claimCols(setOpen)} selected={open?.id ?? null} /></div>}
            </>
          );
        }}
      </ReadGate>
      <ClaimSheet c={open} onClose={() => setOpen(null)} />
      <AddChannel open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

export function AddChannel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [id, setId] = React.useState("");
  return (
    <Sheet open={open} onClose={onClose} titleId="st-add-title">
      <div><h2 id="st-add-title" style={{ margin: 0 }}>Add a Telegram channel</h2><p className="st-sub" style={{ margin: "6px 0 0" }}>What it takes today, and what the app cannot do yet.</p></div>
      <div className="st-gap" role="note"><strong>The app cannot add a channel yet.</strong>The backend has no route for it: the allowed chats are a host setting read when the API starts. Nothing here changes intake, the engine or any trading state.</div>
      <div className="st-stack" style={{ gap: 14 }}>{[["Make sure the capture account is a member", "The Telegram account used by TWINS capture must already be in the channel and able to read it."], ["Add the chat id to the intake allow-list", "Done on the host, in the intake policy setting. The API reads it only at start."], ["Restart intake, then check Channels", "The channel appears after its first captured message. Choose its stop-basis default separately."]].map(([t, b], k) => <div key={t} className="st-step"><b>{k + 1}</b><p><strong>{t}</strong>{b}</p></div>)}</div>
      <label className="st-field">Channel id (for your own notes, nothing is sent)<input value={id} onChange={(e) => setId(e.target.value.replace(/[^0-9-]/g, "").slice(0, 20))} inputMode="numeric" placeholder="-100…" /></label>
      <button className="st-btn" disabled title="Needs a backend route and its own review">Add channel</button>
      <p className="st-sub" style={{ margin: 0 }}>Proposed separate scope: an owner-only, audited &quot;request a channel&quot; route that records the request for approval on the host, without changing the live allow-list.</p>
    </Sheet>
  );
}
export type { TelegramChannel };
export { Card, Ladder };
