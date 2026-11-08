"use client";
import React from "react";
import { Plus, Send } from "lucide-react";
import { CHANNEL_STEPS, SIGNALS, type StudioSignal } from "@/studio/fixtures";
import { SignalDetail } from "@/studio/SignalDetail";
import { StateGate } from "@/studio/state";
import { Chip, STATUS, STOP, ageText, title } from "@/studio/ui";

const STATUS_FILTERS = [["all", "All"], ["APPROVED_FOR_REVIEW", "Ready"], ["INSUFFICIENT_EVIDENCE", "Held back"], ["REJECTED", "Rejected"], ["EXPIRED", "Expired"]] as const;

export default function SignalsPage() {
  return <StateGate what="signals"><Workspace /></StateGate>;
}

const AGE_FILTERS = [["all", "Any time", 99999], ["hour", "Last hour", 60], ["today", "Today", 600]] as const;

function Workspace() {
  const [status, setStatus] = React.useState<string>("all");
  const [channel, setChannel] = React.useState<string>("all");
  const [sel, setSel] = React.useState<StudioSignal | null>(SIGNALS[0] ?? null);
  const [market, setMarket] = React.useState<string>("all");
  const [side, setSide] = React.useState<string>("all");
  const [age, setAge] = React.useState<string>("all");
  const [adding, setAdding] = React.useState(false);
  const [narrow, setNarrow] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [fOpen, setFOpen] = React.useState<boolean | null>(null);
  const filtersOpen = fOpen ?? !narrow;
  const active = [status, channel, market, side, age].filter((v) => v !== "all").length;
  React.useEffect(() => { const m = window.matchMedia("(max-width:1100px)"); const f = (): void => setNarrow(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  const channels = [...new Set(SIGNALS.map((s) => s.channel))];
  const rows = SIGNALS.filter((s) => (status === "all" || s.status === status) && (channel === "all" || s.channel === channel) && (market === "all" || s.market === market) && (side === "all" || s.side === side) && s.ageMin <= (AGE_FILTERS.find((a) => a[0] === age)?.[2] ?? 99999));
  const shown = sel && rows.some((r) => r.id === sel.id) ? sel : rows[0] ?? null;
  React.useEffect(() => { if (location.hash === "#add-channel") setAdding(true); }, []);

  return (
    <>
      <header className="st-top">
        <div><h1>Signals</h1><p>Every signal with where it came from and where it stands.</p></div>
        <button className="st-btn" onClick={() => setAdding(true)}><Plus size={17} aria-hidden />Add Telegram channel</button>
      </header>

      <div className="st-filters" role="group" aria-label="Origin">
        <button className="st-fbtn" aria-pressed="true"><Send size={14} aria-hidden />Telegram · {SIGNALS.length}</button>
        <button className="st-fbtn" disabled title="Not built: the system does not generate signals today">System-generated · not available</button>
      </div>
      <details className="st-disc st-fdisc" open={filtersOpen} onToggle={(e) => setFOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Filters{active ? ` · ${active} active` : ""}</summary>
        <div className="st-discbody st-stack" style={{ gap: 10 }}>
      <div className="st-filters" role="group" aria-label="Filters">
        {STATUS_FILTERS.map(([k, l]) => <button key={k} className="st-fbtn" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>)}
        <span style={{ width: 8 }} />
        <button className="st-fbtn" aria-pressed={channel === "all"} onClick={() => setChannel("all")}>All channels</button>
        {channels.map((c) => <button key={c} className="st-fbtn" aria-pressed={channel === c} onClick={() => setChannel(c)}>{c}</button>)}
      </div>
      <div className="st-filters" role="group" aria-label="More filters">
        {(["all", "NSE", "BSE"] as const).map((m) => <button key={m} className="st-fbtn" aria-pressed={market === m} onClick={() => setMarket(m)}>{m === "all" ? "All markets" : m}</button>)}
        <span style={{ width: 8 }} />
        {(["all", "BUY", "SELL"] as const).map((m) => <button key={m} className="st-fbtn" aria-pressed={side === m} onClick={() => setSide(m)}>{m === "all" ? "Buy and sell" : m === "BUY" ? "Buy" : "Sell"}</button>)}
        <span style={{ width: 8 }} />
        {AGE_FILTERS.map(([k, l]) => <button key={k} className="st-fbtn" aria-pressed={age === k} onClick={() => setAge(k)}>{l}</button>)}
      </div>
      <p className="st-sub" style={{ margin: "-6px 2px 0" }}>Market, side and time filters run in your browser on the signals already loaded: the API has no such filters yet.</p>
        </div>
      </details>

      <div className="st-ws">
        <div className="st-stack" role="list" aria-label="Signals">
          {rows.length === 0 ? <div className="st-card"><h2>No signals match</h2><p className="st-sub">Change a filter. This is an empty result, not an error.</p></div> : rows.map((s) => (
            <button key={s.id} role="listitem" className="st-sig" aria-pressed={shown?.id === s.id} onClick={() => { setSel(s); if (narrow) setSheet(true); }}>
              <span className="st-avatar" aria-hidden>{s.underlying.slice(0, 2)}</span>
              <span className="grow"><span className="t" style={{ display: "block" }}>{title(s)} · {s.side}</span>
                <span className="s" style={{ display: "block" }}>Telegram · {s.channel} · {s.market} · {s.receivedAt} IST · {ageText(s.ageMin)}</span>
                <span className="s num" style={{ display: "block", color: "var(--ink)", fontWeight: 600 }}>Entry {s.entry.kind} {s.entry.price} · Stop {s.stop ?? "none"} · Targets {s.targets.join(" / ")} · {s.expiry ?? "no expiry"}</span>
                <span style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}><Chip tone={STOP[s.stopQuality].tone}>{STOP[s.stopQuality].label}</Chip>{s.basisInferred ? <Chip tone="info">Premium inferred</Chip> : null}{s.blockers[0] ? <Chip tone="mute">{s.blockers[0].text}</Chip> : null}</span></span>
              <Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip>
            </button>
          ))}
        </div>
        {narrow ? null : <aside className="st-card" aria-label="Selected signal" style={{ position: "sticky", top: 16 }}>
          {shown ? <SignalDetail s={shown} /> : <p className="st-sub">Select a signal to see its full analysis.</p>}
        </aside>}
      </div>
      {narrow && sheet && shown ? <SignalDetail s={shown} modal onClose={() => setSheet(false)} /> : null}

      {adding ? <AddChannel onClose={() => setAdding(false)} /> : null}
    </>
  );
}

function AddChannel({ onClose }: { onClose: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [id, setId] = React.useState("");
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus?.(); };
  }, [onClose]);
  return (
    <>
      <div className="st-scrim" onClick={onClose} aria-hidden />
      <aside className="st-panel" role="dialog" aria-modal="true" aria-labelledby="st-add-title">
        <div className="st-panel-head"><button ref={closeRef} className="st-btn ghost st-close" style={{ padding: "8px 14px" }} onClick={onClose}>Close</button></div>
        <div className="st-panel-body">
        <div><h2 id="st-add-title">Add a Telegram channel</h2><p className="st-sub" style={{ margin: "6px 0 0" }}>What it takes today, and what the app cannot do yet.</p></div>
        <div className="st-gap" role="note"><strong>The app cannot add a channel yet.</strong>The backend has no route for it: the allowed chats are a host setting read when the API starts. Nothing below changes intake, the engine or any trading state.</div>
        <div className="st-stack" style={{ gap: 14 }}>{CHANNEL_STEPS.map((s) => <div key={s.n} className="st-step"><b>{s.n}</b><p><strong>{s.title}</strong>{s.body}</p></div>)}</div>
        <label className="st-field">Channel id (for your own notes, nothing is sent)
          <input value={id} onChange={(e) => setId(e.target.value.replace(/[^0-9-]/g, "").slice(0, 20))} inputMode="numeric" placeholder="-100…" /></label>
        <button className="st-btn" disabled title="Needs a backend route and its own review">Add channel</button>
        <p className="st-sub" style={{ margin: 0 }}>Proposed separate scope: an owner-only, audited &quot;request a channel&quot; route that records the request for approval on the host, without changing the live allow-list.</p>
        </div>
      </aside>
    </>
  );
}
