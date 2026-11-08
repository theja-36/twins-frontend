"use client";
import React from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers, List } from "lucide-react";
import { SIGNALS, type StudioSignal } from "./fixtures";
import { SignalDetail } from "./SignalDetail";
import { Chip, FRESH, LevelLadder, STATUS, STOP, ageText, title } from "./ui";

const SHOWN_BEHIND = 3;
const SWIPE_PX = 90, SWIPE_VELOCITY = 500;

/** Navigation only. Swiping, dragging, the arrow buttons and the keys move between cards; nothing here approves, rejects or dismisses a signal. */
export function Deck({ signals = SIGNALS }: { signals?: StudioSignal[] }) {
  const reduce = useReducedMotion();
  const [view, setView] = React.useState<"deck" | "list">("deck");
  const [i, setI] = React.useState(0);
  const [open, setOpen] = React.useState<StudioSignal | null>(null);
  const n = signals.length;
  const go = React.useCallback((d: number): void => setI((c) => Math.min(n - 1, Math.max(0, c + d))), [n]);
  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); setI(0); } else if (e.key === "End") { e.preventDefault(); setI(n - 1); }
    else if (e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); setOpen(signals[i] ?? null); }
  };
  const cur = signals[i];
  return (
    <div className="st-stack" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="st-seg" role="group" aria-label="View">
          <button aria-pressed={view === "deck"} onClick={() => setView("deck")}><Layers size={16} aria-hidden />Deck</button>
          <button aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} aria-hidden />List</button>
        </div>
        <span className="st-chip mute">{n} signals · newest first</span>
      </div>

      {view === "deck" ? (
        <div className="st-deckwrap">
          <div>
            <div className="st-stage" tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Decision deck. Left and right arrow keys move between cards. Enter opens the full analysis." onKeyDown={onKey}>
              {signals.map((s, idx) => {
                const off = idx - i;
                if (off < 0 || off > SHOWN_BEHIND) return null;
                return <DeckCard key={s.id} s={s} off={off} reduce={!!reduce} count={`${idx + 1} of ${n}`} onGo={go} onOpen={() => setOpen(s)} />;
              })}
            </div>
            <div className="st-controls">
              <button className="st-iconbtn" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous signal" style={{ opacity: i === 0 ? .4 : 1 }}><ChevronLeft aria-hidden /></button>
              <div className="st-dots" role="group" aria-label="Pick a signal">{signals.map((s, k) => <button key={s.id} aria-current={k === i} aria-label={`Signal ${k + 1}: ${title(s)}`} onClick={() => setI(k)} />)}</div>
              <button className="st-iconbtn" onClick={() => go(1)} disabled={i === n - 1} aria-label="Next signal" style={{ opacity: i === n - 1 ? .4 : 1 }}><ChevronRight aria-hidden /></button>
            </div>
            <p className="st-hint" aria-live="polite">{cur ? `${i + 1} of ${n}: ${title(cur)}. ` : ""}Swipe, drag or use the arrows. Navigating never approves or dismisses anything.</p>
          </div>
          <aside className="st-card" aria-label="Up next">
            <h2>Up next</h2><p className="st-sub">Jump straight to a card.</p>
            <ul className="st-list">{signals.map((s, k) => (
              <li key={s.id} className="st-row"><button className="st-link grow" onClick={() => setI(k)} aria-current={k === i}><span className="t" style={{ display: "block", color: k === i ? undefined : "var(--ink)" }}>{title(s)}</span><span className="s" style={{ fontWeight: 500 }}>{s.channel} · {ageText(s.ageMin)}</span></button><Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip></li>))}</ul>
          </aside>
        </div>
      ) : (
        <div className="st-card"><div className="st-tablewrap">
          <table className="st-table"><caption className="sr-only" style={{ position: "absolute", left: -9999 }}>All signals</caption>
            <thead><tr><th>Instrument</th><th>Side</th><th>Origin</th><th>Status</th><th>Entry / Stop</th><th>Stop quality</th><th>Received</th></tr></thead>
            <tbody>{signals.map((s) => (
              <tr key={s.id} onClick={() => setOpen(s)}>
                <td><button className="st-link" onClick={(e) => { e.stopPropagation(); setOpen(s); }}>{title(s)}</button><div className="st-sub" style={{ margin: 0, fontSize: 12 }}>{s.expiry ?? "no expiry"}</div></td>
                <td>{s.side}</td><td>Telegram · {s.channel}</td><td><Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip></td>
                <td className="num">{s.entry.price} / {s.stop ?? "—"}</td><td><Chip tone={STOP[s.stopQuality].tone}>{STOP[s.stopQuality].label}</Chip></td><td className="num">{s.receivedAt} · {ageText(s.ageMin)}</td>
              </tr>))}</tbody></table></div></div>
      )}
      {open ? <SignalDetail s={open} modal onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function DeckCard({ s, off, reduce, count, onGo, onOpen }: { s: StudioSignal; off: number; reduce: boolean; count: string; onGo: (d: number) => void; onOpen: () => void }) {
  const x = useMotionValue(0);
  const active = off === 0;
  const tilt = off === 0 ? 0 : (off % 2 === 0 ? 1 : -1) * (1.2 + off * 0.5);
  const target = { y: off * 14, scale: 1 - off * 0.045, rotate: tilt, opacity: 1 - off * 0.16 };
  const onEnd = (_: unknown, info: PanInfo): void => {
    const dir = info.offset.x < -SWIPE_PX || info.velocity.x < -SWIPE_VELOCITY ? 1 : info.offset.x > SWIPE_PX || info.velocity.x > SWIPE_VELOCITY ? -1 : 0;
    if (dir !== 0) onGo(dir);
    animate(x, 0, reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 });
  };
  return (
    <motion.article
      className={`st-deckcard${active ? "" : " back"}`} data-active={active} aria-hidden={!active} aria-label={active ? `${title(s)}, ${count}` : undefined}
      style={{ x: active ? x : 0, zIndex: 10 - off }} initial={false} animate={target}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      drag={active ? "x" : false} dragElastic={0.5} dragConstraints={{ left: 0, right: 0 }} onDragEnd={active ? onEnd : undefined}
    >
      {active ? <CardFront s={s} onOpen={onOpen} /> : null}
    </motion.article>
  );
}

function CardFront({ s, onOpen }: { s: StudioSignal; onOpen: () => void }) {
  const topBlocker = s.blockers[0];
  return (
    <>
      <div className="st-cardhead">
        <div><h3>{title(s)}</h3>
          <div className="st-meta"><Chip tone={s.side === "BUY" ? "ok" : "bad"}>{s.side}</Chip><Chip tone="info">Telegram · {s.channel}</Chip><Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip></div></div>
        <div style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12.5, color: "var(--ink2)", fontWeight: 600 }} className="num">{s.receivedAt} IST<br /><span style={{ color: "var(--ink3)", fontWeight: 500 }}>{ageText(s.ageMin)}</span></div>
      </div>
      <div className="st-levels">
        <LevelLadder s={s} />
        <div className="st-levelnums num">
          <div><small><i className="s" />Stop</small><strong style={{ color: s.stop === null ? "var(--bad)" : undefined }}>{s.stop ?? "none"}</strong></div>
          <div><small><i className="e" />Entry</small><strong>{s.entry.price}<em>{s.entry.kind}</em></strong></div>
          {s.targets.slice(0, 2).map((t, i) => <div key={t}><small><i className="t" />T{i + 1}</small><strong>{t}</strong></div>)}
        </div>
      </div>
      <p className="st-why">{s.rationale}</p>
      <div className="st-facts">
        <div className="st-fact"><b>Stop quality</b><Chip tone={STOP[s.stopQuality].tone}>{STOP[s.stopQuality].label}</Chip></div>
        <div className="st-fact"><b>Main blocker</b>{topBlocker ? <strong>{topBlocker.text}</strong> : <strong>None recorded</strong>}</div>
        <div className="st-fact" style={{ gridColumn: "1 / -1" }}><b>Data freshness</b><Chip tone={FRESH[s.freshness.state].tone}>{FRESH[s.freshness.state].label}</Chip> {s.freshness.note}</div>
      </div>
      <div className="st-cardfoot">
        <button className="st-btn" onClick={onOpen} onPointerDownCapture={(e) => e.stopPropagation()}>Full analysis</button>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="st-btn ghost" disabled title="Approving is done in the Telegram approval bot">Approve</button>
          <button className="st-btn ghost" disabled title="Rejecting is done in the Telegram approval bot">Reject</button>
        </span>
      </div>
    </>
  );
}
