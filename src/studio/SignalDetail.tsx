"use client";
import React from "react";
import { X } from "lucide-react";
import type { StudioSignal, Tone } from "./fixtures";
import { Chip, FRESH, LevelLadder, STATUS, STOP, ageText, title } from "./ui";

const VERDICT: Record<string, Tone> = { supportive: "ok", neutral: "mute", caution: "warn", adverse: "bad", unavailable: "mute" };

/** Full analysis. `modal` shows it as a dialog (scrim, Escape, focus return); otherwise it renders inline. */
export function SignalDetail({ s, modal = false, onClose }: { s: StudioSignal; modal?: boolean; onClose?: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!modal) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus?.(); };
  }, [modal, onClose]);
  const body = (
    <>
      <div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip><Chip tone="info">Telegram · {s.channel}</Chip><Chip tone={STOP[s.stopQuality].tone}>{STOP[s.stopQuality].label}</Chip>
        </div>
        <h2 id="st-detail-title">{title(s)} · {s.side}</h2>
        <p className="st-sub" style={{ margin: "6px 0 0" }}>{s.expiry ?? "Expiry not given"} · received {s.receivedAt} IST ({ageText(s.ageMin)})</p>
      </div>
      <div className="st-levels"><LevelLadder s={s} />
        <div className="st-levelnums num">
          <div><small><i className="s" />Stop</small><strong>{s.stop ?? "—"}</strong></div><div><small><i className="e" />Entry</small><strong>{s.entry.price}<em>{s.entry.kind}</em></strong></div>
          {s.targets.slice(0, 2).map((t, i) => <div key={t}><small><i className="t" />T{i + 1}</small><strong>{t}</strong></div>)}
        </div>
      </div>
      <section><h4>Assessment</h4>
        <p className="st-why"><strong>{s.analysis.assessment}</strong> · decided by {s.analysis.decidedBy}</p>
        <p className="st-sub" style={{ margin: "6px 0 0" }}>{s.rationale}</p></section>
      <section><h4>What each check said</h4>
        {s.analysis.agents.map((a) => <div key={a.id} className="st-agent"><Chip tone={VERDICT[a.verdict]}>{a.verdict}</Chip><span style={{ fontWeight: 700, fontSize: 13.5 }}>{a.id}</span><span className="st-sub" style={{ margin: 0, marginLeft: "auto", textAlign: "right" }}>{a.note}</span></div>)}</section>
      <section><h4>What is holding it back</h4>
        {s.blockers.length === 0 ? <p className="st-sub">Nothing recorded as blocking.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{s.blockers.map((b) => <div key={b.code} className="st-agent" style={{ borderTop: 0, padding: 0 }}><Chip tone={b.severity === "blocking" ? "bad" : "warn"}>{b.severity}</Chip><span style={{ fontSize: 13.5, fontWeight: 600 }}>{b.text}</span></div>)}</div>}</section>
      <section><h4>Stop quality</h4><p className="st-sub" style={{ margin: 0 }}>{s.stopNote}</p></section>
      <section><h4>Data freshness</h4><p className="st-sub" style={{ margin: 0 }}><Chip tone={FRESH[s.freshness.state].tone}>{FRESH[s.freshness.state].label}</Chip> {s.freshness.note}</p></section>
      <section className="st-note">Approve and Reject are done in the Telegram approval bot, which re-checks every gate. The web app only reads.</section>
    </>
  );
  if (!modal) return <div className="st-stack" style={{ gap: 16 }}>{body}</div>;
  return (
    <>
      <div className="st-scrim" onClick={onClose} aria-hidden />
      <aside className="st-panel" role="dialog" aria-modal="true" aria-labelledby="st-detail-title">
        <button ref={closeRef} className="st-iconbtn st-close" onClick={onClose} aria-label="Close full analysis"><X size={20} aria-hidden /></button>
        {body}
      </aside>
    </>
  );
}
