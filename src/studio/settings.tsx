"use client";
import React from "react";
import type { HealthStatus, Readiness, SourceHealthProfile, SystemConfig, TelegramChannel } from "@/types/trading";
import { arr, obj, useRead } from "./data";
import { Card, Chip, ReadGate } from "./kit";
import { SRC_TONE, ageText, words, type Tone } from "./model";

const GROUPS = [["safety", "Safety"], ["trading", "Trading"], ["data", "Data"], ["connections", "Connections"]] as const;
const flag = (v: boolean | undefined, onText: string, offText: string, onTone: Tone, offTone: Tone): [string, Tone] => (v === undefined ? ["unreadable", "warn"] : v ? [onText, onTone] : [offText, offTone]);
const Row = ({ k, children, note }: { k: string; children: React.ReactNode; note?: string }) => <li className="st-row"><div className="grow"><div className="t">{k}</div>{note ? <div className="s">{note}</div> : null}</div><div>{children}</div></li>;

export function SettingsView() {
  const cfg = useRead<SystemConfig>("system/config", obj<SystemConfig>("environment"), 60_000);
  const health = useRead<HealthStatus>("health/status", obj<HealthStatus>("status"), 30_000);
  const ready = useRead<Readiness>("paper/readiness", obj<Readiness>("items"), 60_000);
  const src = useRead<SourceHealthProfile>("market/sources", (r) => (r && typeof r === "object" && Array.isArray((r as SourceHealthProfile).providers) ? (r as SourceHealthProfile) : null), 30_000);
  const chans = useRead<TelegramChannel[]>("telegram/channels", arr<"channels", TelegramChannel>("channels"));
  const quote = src.data?.providers.find((p) => p.provider === "market-quotes");
  return (
    <div className="st-split st-settings">
      <nav className="st-card st-index" aria-label="Settings sections">{GROUPS.map(([id, l]) => <a key={id} href={`#${id}`} className="st-nav">{l}</a>)}</nav>
      <div className="st-stack" style={{ gap: 16 }}>
        <section id="safety" className="st-anchor"><Card title="Safety" sub="Read-only. These change on the server, never from this page.">
          <ReadGate read={cfg} what="the safety settings">
            {(c) => { const rc = c.runtimeControls; const t = flag(rc?.tradingEnabled, "enabled", "off", "bad", "ok"), i = flag(rc?.intakeEnabled, "on", "off", "ok", "warn"), k = flag(rc?.killSwitchActive, "ACTIVE", "off", "bad", "ok"); return (
              <ul className="st-list">
                <Row k="Live trading" note="Locked in code; cannot be enabled by a setting."><Chip tone="ok">locked off</Chip></Row>
                <Row k="Broker orders" note="No order path exists."><Chip tone="ok">none</Chip></Row>
                <Row k="Trading switch"><Chip tone={t[1]}>{t[0]}</Chip></Row>
                <Row k="Telegram intake"><Chip tone={i[1]}>{i[0]}</Chip></Row>
                <Row k="Kill switch"><Chip tone={k[1]}>{k[0]}</Chip></Row>
                <Row k="Environment" note={`mode ${c.environment.tradingMode ?? "unknown"}`}><Chip tone="mute">{c.environment.appEnv ?? "unknown"}</Chip></Row>
                <Row k="Live-trading guard"><Chip tone={c.environment.liveTradingGuardPasses ? "ok" : "bad"}>{c.environment.liveTradingGuardPasses ? "passes" : "FAILS"}</Chip></Row>
              </ul>); }}
          </ReadGate>
          <h3 style={{ margin: "14px 0 4px", fontSize: 14 }}>Backend health</h3>
          <ReadGate read={health} what="backend health">{(h) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip tone={h.status === "ok" ? "ok" : "warn"}>{h.status}</Chip><Chip tone={h.database?.ok ? "ok" : "bad"}>database {h.database?.ok ? "ok" : "not ok"}</Chip><Chip tone={h.redis?.ok ? "ok" : "bad"}>queue {h.redis?.ok ? "ok" : "not ok"}</Chip></div>}</ReadGate>
        </Card></section>

        <section id="trading" className="st-anchor"><Card title="Trading" sub="Paper trading, the research engine and risk limits.">
          <ReadGate read={cfg} what="trading settings">
            {(c) => (
              <ul className="st-list">
                <Row k="Paper trading" note={c.paperTrading.armedByHost ? "Armed on the host" : "Not armed on the host"}><Chip tone={c.paperTrading.effective ? "ok" : "mute"}>{c.paperTrading.effective ? "effective" : "off"}</Chip></Row>
                <Row k="Research engine" note={c.agentEngine.valid ? `required: ${(c.agentEngine.requiredAgents ?? []).join(", ") || "none"}` : "configuration is invalid"}><Chip tone={c.agentEngine.enabled ? "warn" : "mute"}>{c.agentEngine.enabled ? "enforcing" : "not enforcing"}</Chip> <Chip tone={c.agentEngine.shadow ? "info" : "mute"}>{c.agentEngine.shadow ? "shadow on" : "shadow off"}</Chip></Row>
                {(["sizing", "portfolio", "circuitBreakers", "expiry"] as const).map((r) => <Row key={r} k={`Risk limits: ${words(r)}`}><Chip tone={c.risk[r]?.valid ? "ok" : "bad"}>{c.risk[r]?.valid ? "valid" : "invalid"}</Chip></Row>)}
              </ul>)}
          </ReadGate>
          <h3 style={{ margin: "14px 0 4px", fontSize: 14 }}>Paper readiness</h3>
          <ReadGate read={ready} what="paper readiness">{(r) => <><p className="st-sub">{r.readyToEnable ? "All checks pass. Enabling is still a separate, deliberate step." : `Not ready: ${r.blockers.length} blocker${r.blockers.length === 1 ? "" : "s"}.`}</p><ul className="st-list">{r.items.map((it) => <Row key={it.id} k={it.title} note={it.detail}><Chip tone={it.status === "pass" ? "ok" : it.status === "fail" ? "bad" : "mute"}>{it.status}</Chip></Row>)}</ul></>}</ReadGate>
        </Card></section>

        <section id="data" className="st-anchor"><div className="st-grid st-two">
          <Card title="Provider health">
            <ReadGate read={src} what="provider health">{(s) => <ul className="st-list">{s.providers.map((p) => <Row key={p.provider} k={p.provider} note={`${p.reasons.join("; ") || "no problems reported"} · data ${ageText(p.dataAgeSeconds)}`}><Chip tone={SRC_TONE[p.status]}>{p.status.toLowerCase()}</Chip></Row>)}</ul>}</ReadGate>
          </Card>
          <Card title="Channels (view only)" sub="Capture is a host setting; this page cannot change it.">
            <ReadGate read={chans} what="channels" isEmpty={(d) => d.length === 0}>{(d) => <ul className="st-list">{d.map((c) => <Row key={c.id} k={c.channel} note={`${c.messages} messages · ${c.lastMessageAgeSeconds === null ? "no messages" : `last ${ageText(c.lastMessageAgeSeconds).replace(" old", " ago")}`}`}><Chip tone={c.captureAllowed === true ? "ok" : c.captureAllowed === false ? "bad" : "mute"}>{c.captureAllowed === true ? "allowed" : c.captureAllowed === false ? "not allowed" : "unknown"}</Chip></Row>)}</ul>}</ReadGate>
          </Card>
        </div></section>

        <section id="connections" className="st-anchor"><Card title="Connections" sub="Configured, connected, feed verified and feed running are four different things. This app can evidence none of them for a broker.">
          <div className="st-tablewrap"><table className="st-table"><caption className="st-sr">Broker connection states</caption>
            <thead><tr><th>Broker</th><th>Configured</th><th>Connected</th><th>Feed verified</th><th>Feed running</th></tr></thead>
            <tbody>
              <tr><td data-label="Broker"><b>Zerodha Kite</b></td><td data-label="Configured">Not exposed by the API</td><td data-label="Connected">Not shown: login happens on the host</td>
                <td data-label="Feed verified">{quote ? <>Quote data present: source {quote.status.toLowerCase()}, {ageText(quote.dataAgeSeconds)}{quote.source ? `, reports "${quote.source}"` : ""}. That is not proof of a broker feed.</> : "No evidence available"}</td><td data-label="Feed running">Not claimed: no heartbeat route</td></tr>
              <tr><td data-label="Broker"><b>Groww</b></td><td data-label="Configured">No</td><td data-label="Connected">Not connected</td><td data-label="Feed verified">None</td><td data-label="Feed running">None</td></tr>
              <tr><td data-label="Broker"><b>Dhan</b></td><td data-label="Configured">Skipped by decision</td><td data-label="Connected">Not connected</td><td data-label="Feed verified">None</td><td data-label="Feed running">None</td></tr>
            </tbody></table></div>
          <div className="st-note" style={{ marginTop: 12 }}>Read-only broker ports exist in the code, but a port is not a connection. There is no connect, login or order control here, and none will appear for show. No order can be placed anywhere in TWINS (Stage 6 is off).</div>
        </Card></section>
      </div>
    </div>
  );
}
