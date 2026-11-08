"use client";
import React from "react";
import { Copy, Send, X } from "lucide-react";
import { BOT_LINK } from "./botLink";
import type { StudioSignal, Tone } from "./fixtures";
import { BullBar, Chip, FRESH, LevelLadder, STATUS, STOP, ageText, money, title } from "./ui";

const VERDICT: Record<string, Tone> = { supportive: "ok", neutral: "mute", caution: "warn", adverse: "bad", unavailable: "mute" };
const SRC: Record<string, Tone> = { OK: "ok", STALE: "warn", MISSING: "mute" };

function Disclosure({ label, children, open = false }: { label: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="st-disc"><summary>{label}</summary><div className="st-discbody">{children}</div></details>;
}

/** Full analysis. `modal` shows it as a dialog (scrim, Escape, focus return, scrolls inside); otherwise it renders inline. */
export function SignalDetail({ s, modal = false, onClose }: { s: StudioSignal; modal?: boolean; onClose?: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = React.useState<"" | "ok" | "fail">("");
  React.useEffect(() => {
    if (!modal) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus?.(); };
  }, [modal, onClose]);
  const copy = async (): Promise<void> => { try { await navigator.clipboard.writeText(s.decisionId); setCopied("ok"); } catch { setCopied("fail"); } };
  const z = s.sizing;
  const body = (
    <>
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip><Chip tone="info">Telegram · {s.channel}</Chip><Chip tone="mute">{s.market}</Chip><Chip tone={STOP[s.stopQuality].tone}>{STOP[s.stopQuality].label}</Chip>
          {s.basisInferred ? <Chip tone="info">Premium inferred</Chip> : null}
        </div>
        <h2 id="st-detail-title">{title(s)} · {s.side}</h2>
        <p className="st-sub" style={{ margin: "6px 0 0" }}>{s.expiry ?? "Expiry not given"} · received {s.receivedAt} IST ({ageText(s.ageMin)}) · {s.approval}</p>
      </div>
      <div className="st-levels"><LevelLadder s={s} />
        <div className="st-levelnums num">
          <div><small><i className="s" />Stop</small><strong>{s.stop ?? "—"}</strong></div><div><small><i className="e" />Entry</small><strong>{s.entry.price}<em>{s.entry.kind}</em></strong></div>
          {s.targets.slice(0, 2).map((t, i) => <div key={t}><small><i className="t" />T{i + 1}</small><strong>{t}</strong></div>)}
        </div>
        {s.targets.length > 2 ? <p className="st-sub" style={{ margin: "8px 0 0" }}>More targets: {s.targets.slice(2).join(", ")}</p> : null}
      </div>
      <section><h4>Assessment</h4>
        <p className="st-why"><strong>{s.analysis.assessment}</strong> · decided by {s.analysis.decidedBy}</p>
        <p className="st-sub" style={{ margin: "6px 0 10px" }}>{s.rationale}</p>
        <BullBar s={s} /></section>
      <section><h4>Proposed size</h4>
        {z.sized ? <div className="st-kv num"><div>Quantity<strong>{z.qty}</strong></div><div>Largest loss<strong>{money(z.maxLoss ?? 0)}</strong></div><div>Reward to risk<strong>1 : {z.rr}</strong></div><div>Trust tier<strong>{z.trustTier}</strong></div></div>
          : <p className="st-sub" style={{ margin: 0 }}><Chip tone="mute">Not sized</Chip> {z.reason}. Trust tier {z.trustTier} (no scorecards yet).</p>}</section>
      <section><h4>What is holding it back</h4>
        {s.blockers.length === 0 ? <p className="st-sub" style={{ margin: 0 }}>Nothing recorded as blocking.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{s.blockers.map((b) => <div key={b.code} className="st-agent" style={{ borderTop: 0, padding: 0 }}><Chip tone={b.severity === "blocking" ? "bad" : "warn"}>{b.severity}</Chip><span style={{ fontSize: 13.5, fontWeight: 600 }}>{b.text}</span></div>)}</div>}
        {s.analysis.closeCalls.length ? <p className="st-sub" style={{ margin: "10px 0 0" }}>Close calls: {s.analysis.closeCalls.join(" · ")}</p> : null}</section>
      <section><h4>Data health</h4>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{s.sourceHealth.map((h) => <Chip key={h.name} tone={SRC[h.status] ?? "mute"}>{h.name}: {h.status.toLowerCase()}</Chip>)}<Chip tone={FRESH[s.freshness.state].tone}>{FRESH[s.freshness.state].label}</Chip></div>
        <p className="st-sub" style={{ margin: "8px 0 0" }}>{s.freshness.note}</p></section>
      <Disclosure label="What each check said"><>{s.analysis.agents.map((a) => <div key={a.id} className="st-agent" style={{ flexWrap: "wrap" }}><Chip tone={VERDICT[a.verdict]}>{a.verdict}</Chip><span style={{ fontWeight: 700, fontSize: 13.5 }}>{a.id}</span><span className="st-sub" style={{ margin: 0, marginLeft: "auto", textAlign: "right" }}>{a.confidence === null ? "not scored" : `${a.confidence}%`} · {a.note}</span>{a.codes.length ? <span className="st-sub" style={{ margin: 0, width: "100%", fontFamily: "ui-monospace,monospace", fontSize: 11.5 }}>{a.codes.join(", ")}</span> : null}</div>)}</></Disclosure>
      <Disclosure label="Stop quality"><p className="st-sub" style={{ margin: 0 }}>{s.stopNote}</p></Disclosure>
      <section className="st-note">Approve and Reject are done in the Telegram approval bot, which re-checks every gate. The web app only reads.
        <div className="st-actions" style={{ marginTop: 10 }}>
          <button className="st-btn ghost" disabled title="Approval is made in the Telegram approval bot after every gate is re-checked.">Reject</button>
          <button className="st-btn ghost" disabled title="Approval is made in the Telegram approval bot after every gate is re-checked.">Approve for review</button>
          {BOT_LINK ? <a className="st-btn" href={BOT_LINK} target="_blank" rel="noopener noreferrer"><Send size={15} aria-hidden />Open the approval bot in Telegram</a> : <button className="st-btn ghost" disabled title="The bot address is not configured for this frontend (NEXT_PUBLIC_TWINS_APPROVAL_BOT_URL)."><Send size={15} aria-hidden />Open in Telegram · not configured</button>}
          <button className="st-btn ghost" onClick={() => void copy()}><Copy size={15} aria-hidden />Copy decision id</button>
        </div>
        <p className="st-sub" style={{ margin: "8px 0 0" }} role="status">{copied === "ok" ? "Decision id copied." : copied === "fail" ? "Could not copy. Select the id instead: " + s.decisionId : "The bot link opens the bot only. It does not open this decision."}</p></section>
    </>
  );
  if (!modal) return <div className="st-stack" style={{ gap: 16 }}>{body}</div>;
  return (
    <>
      <div className="st-scrim" onClick={onClose} aria-hidden />
      <aside className="st-panel" role="dialog" aria-modal="true" aria-labelledby="st-detail-title">
        <div className="st-panel-head"><button ref={closeRef} className="st-iconbtn st-close" onClick={onClose} aria-label="Close full analysis"><X size={20} aria-hidden /></button></div>
        <div className="st-panel-body">{body}</div>
      </aside>
    </>
  );
}
