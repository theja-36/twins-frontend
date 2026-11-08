"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OVERVIEW as O, SIGNALS } from "@/studio/fixtures";
import { Chip, STATUS, ageText, title } from "@/studio/ui";
import type { Tone } from "@/studio/fixtures";

const SRC: Record<string, Tone> = { OK: "ok", STALE: "warn", MISSING: "mute", SAMPLE: "info" };
const peak = Math.max(...O.perDay.map(([, v]) => v));

export default function Overview() {
  const top = SIGNALS.slice(0, 3);
  return (
    <>
      <header className="st-top">
        <div><h1>Overview</h1><p>{O.asOf}. What arrived, what is held back, and what needs you.</p></div>
        <div className="st-safety" aria-label="Safety state">
          {O.safety.map(([k, v]) => <span key={k} className="st-pill">{k} <b>{v}</b><i className={k === "Shadow" ? "on" : ""} aria-hidden /></span>)}
        </div>
      </header>

      <section className="st-grid st-hero" aria-label="Today at a glance">
        <div className="st-stat st-lav"><span>Signals today</span><strong className="num">{O.counts.today}</strong><em>From Telegram channels</em></div>
        <div className="st-stat st-mint"><span>Ready for review</span><strong className="num">{O.counts.ready}</strong><em>Decide in the approval bot</em></div>
        <div className="st-stat st-peach"><span>Held back</span><strong className="num">{O.counts.blocked}</strong><em>Missing a stop basis, expiry or data</em></div>
        <div className="st-stat st-white"><span>Channels listened to</span><strong className="num">{O.counts.channels}</strong><em>Two active in the last hour</em></div>
      </section>

      <section className="st-grid st-two">
        <div className="st-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div><h2>Decision Deck</h2><p className="st-sub">The newest signals, one card at a time.</p></div>
            <Link href="/studio/deck" className="st-btn">Open the deck <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <ul className="st-list">
            {top.map((s) => (
              <li key={s.id} className="st-row">
                <span className="st-avatar" aria-hidden>{s.underlying.slice(0, 2)}</span>
                <div className="grow"><div className="t">{title(s)} · {s.side}</div><div className="s">{s.blockers[0]?.text ?? "Passed every gate"} · {ageText(s.ageMin)}</div></div>
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
          <h2>Channels</h2><p className="st-sub">Masked ids. Counts only, never message text.</p>
          <ul className="st-list">{O.channels.map((c) => (
            <li key={c.name} className="st-row"><span className="st-avatar" aria-hidden>{c.name.slice(-2)}</span>
              <div className="grow"><div className="t">{c.name}</div><div className="s">{c.messages} messages · {c.claims} signals · {c.last}</div></div>
              <Chip tone={c.state === "live" ? "ok" : "mute"}>{c.state}</Chip></li>))}</ul>
          <div style={{ marginTop: 12 }}><Link href="/studio/signals#add-channel" className="st-btn ghost">Add a channel</Link></div>
        </div>
        <div className="st-card">
          <h2>Data sources</h2><p className="st-sub">Missing, stale and sample stay distinct.</p>
          <ul className="st-list">{O.sources.map((s) => (
            <li key={s.name} className="st-row"><div className="grow"><div className="t">{s.name}</div><div className="s">{s.note}</div></div><Chip tone={SRC[s.status] ?? "mute"}>{s.status.toLowerCase()}</Chip></li>))}</ul>
        </div>
        <div className="st-card">
          <h2>Recent activity</h2><p className="st-sub">Newest first.</p>
          <ul className="st-list">{O.activity.map(([t, a, b], k) => (
            <li key={k} className="st-row"><span className="st-time">{t}</span><div className="grow"><div className="t" style={{ fontSize: 13.5 }}>{a}</div><div className="s">{b}</div></div></li>))}</ul>
        </div>
      </section>
    </>
  );
}
