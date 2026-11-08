"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OVERVIEW as O, SIGNALS } from "@/studio/fixtures";
import { StateGate, useFixtureState } from "@/studio/state";
import { Chip, STATUS, ageText, money, title } from "@/studio/ui";
import type { Tone } from "@/studio/fixtures";

const SRC: Record<string, Tone> = { OK: "ok", STALE: "warn", MISSING: "mute", SAMPLE: "info" };
const peak = Math.max(...O.perDay.map(([, v]) => v));
const sign = (n: number): string => `${n < 0 ? "−" : "+"}${money(Math.abs(n))}`;

export default function Overview() {
  const fx = useFixtureState();
  const top = SIGNALS.slice(0, 3);
  return (
    <>
      <header className="st-top">
        <div><h1>Overview</h1><p>{O.asOf}. What arrived, what is held back, and what needs you.</p></div>
        <div className="st-safety" aria-label="Safety state">
          {O.safety.map(([k, v]) => <span key={k} className="st-pill">{k} <b>{v}</b><i className={k === "Shadow" ? "on" : ""} aria-hidden /></span>)}
        </div>
      </header>
      <StateGate what="the overview">
        <section className="st-grid st-hero" aria-label="Today at a glance">
          <div className="st-stat st-lav"><span>Signals today</span><strong className="num">{O.counts.today}</strong><em>From Telegram channels</em></div>
          <div className="st-stat st-mint"><span>Ready for review</span><strong className="num">{O.counts.ready}</strong><em>Decide in the approval bot</em></div>
          <div className="st-stat st-peach"><span>Held back</span><strong className="num">{O.counts.blocked}</strong><em>Missing a stop basis, expiry or data</em></div>
          <div className="st-stat st-white"><span>Channels listened to</span><strong className="num">{O.counts.channels}</strong><em>Two active in the last hour</em></div>
        </section>

        <section className="st-card" aria-label="Paper portfolio">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2>Paper portfolio</h2><p className="st-sub">Simulated trades only. No order is ever placed.</p></div><Link href="/studio" className="st-btn ghost" aria-disabled style={{ opacity: .5, pointerEvents: "none" }}>Portfolio · next page</Link></div>
          <div className="st-kv num" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
            <div>Available capital<strong style={{ color: "var(--ink3)" }}>Not available</strong><span style={{ fontSize: 11.5 }}>The API exposes no capital figure</span></div>
            <div>Paper P&amp;L<strong className={O.portfolio.paperPnl >= 0 ? "st-tone-ok" : "st-tone-bad"}>{sign(O.portfolio.paperPnl)}</strong></div>
            <div>Day P&amp;L<strong className={O.portfolio.dayPnl >= 0 ? "st-tone-ok" : "st-tone-bad"}>{sign(O.portfolio.dayPnl)}</strong></div>
            <div>Exposure<strong>{money(O.portfolio.exposure)}</strong></div>
            <div>Largest drawdown<strong>{O.portfolio.drawdownR} R</strong></div>
          </div>
          <h3 style={{ margin: "18px 0 4px", fontSize: 14 }}>Open paper positions</h3>
          <p className="st-sub" style={{ margin: "0 0 6px" }}>The API gives no quote time per position, so freshness is the time of this page&apos;s last refresh.</p>
          {O.positions.length === 0 ? <p className="st-sub">No open paper positions.</p> : (
            <ul className="st-list">{O.positions.map((p) => (
              <li key={p.symbol} className="st-row"><div className="grow"><div className="t">{p.symbol} · {p.side}</div><div className="s num">{p.qty} qty · entry {p.entry}{p.last !== null ? ` · last ${p.last}` : ""}</div></div>
                <div style={{ textAlign: "right" }}><Chip tone={p.state === "OPEN" ? "ok" : "info"}>{p.state === "OPEN" ? "open" : "pending entry"}</Chip>{p.state === "OPEN" ? <div className={`num ${p.pnl >= 0 ? "st-tone-ok" : "st-tone-bad"}`} style={{ fontWeight: 800, marginTop: 4 }}>{sign(p.pnl)}</div> : null}</div></li>))}</ul>)}
        </section>

        <section className="st-grid st-two">
          <div className="st-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div><h2>Recent decisions</h2><p className="st-sub">The newest signals and where each stands.</p></div>
              <Link href="/studio/deck" className="st-btn">Open the deck <ArrowRight size={16} aria-hidden /></Link>
            </div>
            <ul className="st-list">
              {top.map((s) => (
                <li key={s.id} className="st-row">
                  <span className="st-avatar" aria-hidden>{s.underlying.slice(0, 2)}</span>
                  <div className="grow"><div className="t">{title(s)} · {s.side}</div><div className="s">{s.blockers[0]?.text ?? "Passed every gate"} · {ageText(s.ageMin)}</div><div className="s">{s.approval}</div></div>
                  <Chip tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Chip>
                </li>
              ))}
            </ul>
          </div>
          <div className="st-card">
            <h2>Signals per day</h2><p className="st-sub">Parsed from channels, last 7 days.</p>
            <div className="st-bars" role="img" aria-label={`Signals per day: ${O.perDay.map(([d, v]) => `${d} ${v}`).join(", ")}`}>
              {O.perDay.map(([d, v], k) => <div key={d} className={`st-bar${k === O.perDay.length - 1 ? " hi" : ""}`}><b className="num">{v}</b><i style={{ height: `${Math.max(4, (v / peak) * 100)}%` }} />{d}</div>)}
            </div>
          </div>
        </section>

        <section className="st-grid st-three">
          <div className="st-card">
            <h2>Market regime</h2><p className="st-sub">What kind of market this is.</p>
            <div className="st-note"><Chip tone="info">SAMPLE</Chip> <strong style={{ color: "var(--ink)" }}>{O.regime.label}</strong><br />{O.regime.note}. This is not live data.</div>
            <h2 style={{ marginTop: 18 }}>Data sources</h2><p className="st-sub">Missing, stale and sample stay distinct.</p>
            <ul className="st-list">{O.sources.map((s) => (
              <li key={s.name} className="st-row"><div className="grow"><div className="t">{s.name}</div><div className="s">{fx === "stale" && s.status === "OK" ? "Updated 3 h 12 min ago" : s.note}</div></div><Chip tone={SRC[fx === "stale" && s.status === "OK" ? "STALE" : s.status] ?? "mute"}>{(fx === "stale" && s.status === "OK" ? "stale" : s.status).toLowerCase()}</Chip></li>))}</ul>
          </div>
          <div className="st-card">
            <h2>Channels</h2><p className="st-sub">Masked ids. Counts only, never message text.</p>
            <ul className="st-list">{O.channels.map((c) => (
              <li key={c.name} className="st-row"><span className="st-avatar" aria-hidden>{c.name.slice(-2)}</span>
                <div className="grow"><div className="t">{c.name}</div><div className="s">{c.messages} messages · {c.claims} signals · {c.last}</div></div>
                <Chip tone={c.state === "live" ? "ok" : "mute"}>{c.state}</Chip></li>))}</ul>
            <div style={{ marginTop: 12 }}><Link href="/studio/signals#add-channel" className="st-btn ghost">Add a channel</Link></div>
          </div>
          <div className="st-card">
            <h2>Recent activity</h2><p className="st-sub">Newest first.</p>
            <ul className="st-list">{O.activity.map(([t, a, b], k) => (
              <li key={k} className="st-row"><span className="st-time">{t}</span><div className="grow"><div className="t" style={{ fontSize: 13.5 }}>{a}</div><div className="s">{b}</div></div></li>))}</ul>
          </div>
        </section>

        <section className="st-card" aria-label="Quick actions"><h2>Go to</h2><p className="st-sub">Every link opens a read-only page.</p>
          <div className="st-qa">
            <Link href="/studio/deck">Decision Deck<small>One card at a time</small></Link>
            <Link href="/studio/signals">Signals<small>Filter and inspect</small></Link>
            <Link href="/studio/signals#add-channel">Add a channel<small>What it takes today</small></Link>
            <Link href="/">Classic app<small>All current pages</small></Link>
          </div></section>
      </StateGate>
    </>
  );
}
