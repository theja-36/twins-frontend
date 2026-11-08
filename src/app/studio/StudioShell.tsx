"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FlaskConical, Layers, LayoutDashboard, LineChart, MoreHorizontal, RefreshCw, Radio, Send, Settings, Wallet } from "lucide-react";
import React from "react";
import { FIXTURES_ENABLED, obj, refreshAll, useRead } from "@/studio/data";
import { Chip, Notice, Sheet } from "@/studio/kit";
import { FixtureStateProvider, STATES, type FixtureState } from "@/studio/state";
import type { HealthStatus } from "@/types/trading";

const NAV = [
  { href: "/studio", label: "Overview", icon: LayoutDashboard },
  { href: "/studio/deck", label: "Decisions", icon: Layers },
  { href: "/studio/signals", label: "Signals", icon: Radio },
  { href: "/studio/channels", label: "Channels", icon: Send },
  { href: "/studio/market", label: "Market", icon: LineChart },
  { href: "/studio/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/studio/settings", label: "Settings", icon: Settings },
] as const;
const BOTTOM = [NAV[0], NAV[1], NAV[2], NAV[5]] as const;

/** Says only what is known about the connection: whether the backend answered. It never claims a live market feed. */
function Connection() {
  const h = useRead<HealthStatus>("health/status", obj<HealthStatus>("status"), 30_000);
  const [tone, text] = FIXTURES_ENABLED ? (["info", "Fixture data (not a backend)"] as const) : h.status === "ok" ? (h.stale ? (["warn", "Backend: last answer is old"] as const) : (["ok", "Backend reachable"] as const)) : h.status === "loading" ? (["mute", "Checking backend"] as const) : h.status === "unconfigured" ? (["mute", "No backend connected"] as const) : h.status === "unauthorized" ? (["bad", "Backend refused the key"] as const) : h.status === "absent" ? (["mute", "Health route missing"] as const) : (["bad", "Backend not reachable"] as const);
  return <span className="st-pill" role="status"><Chip tone={tone}>{text}</Chip><button className="st-iconbtn st-mini" onClick={refreshAll} aria-label="Refresh all data on this page"><RefreshCw size={14} aria-hidden /></button></span>;
}

function ConnectionNotice() {
  const h = useRead<HealthStatus>("health/status", obj<HealthStatus>("status"), 30_000);
  if (FIXTURES_ENABLED || h.status !== "unconfigured") return null;
  return <Notice tone="info" title="No backend is connected to this app.">The server has no API address or key configured, so nothing can be read. Pages show what they cannot read instead of made-up numbers.</Notice>;
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [fx, setFx] = React.useState<FixtureState>("populated");
  const [more, setMore] = React.useState(false);
  React.useEffect(() => { if (!FIXTURES_ENABLED) return; const q = new URLSearchParams(location.search).get("fx"); const hit = STATES.find(([k]) => k === q); if (hit) setFx(hit[0]); }, []);
  const cur = (h: string): "page" | undefined => (h === "/studio" ? (path === "/studio" ? "page" : undefined) : path.startsWith(h) ? "page" : undefined);
  return (
    <FixtureStateProvider value={fx}>
      <div className="st-shell">
        <aside className="st-side" aria-label="Main">
          <div className="st-brand"><span className="st-logo"><Bell size={17} aria-hidden /></span>TWINS</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }} aria-label="Pages">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="st-nav" aria-current={cur(n.href)}><n.icon size={19} aria-hidden />{n.label}</Link>)}
          </nav>
          <div className="st-sidefoot"><strong>Read-only.</strong> Approving happens in the Telegram approval bot. Nothing here can place an order.<br /><Link href="/" style={{ color: "inherit", fontWeight: 700 }}>Open the classic app</Link></div>
        </aside>
        <div className="st-main">
          {FIXTURES_ENABLED ? (
            <div className="st-fixture" role="note"><FlaskConical size={18} aria-hidden />TEST FIXTURES: every number on these pages is invented and not read from the backend.
              <div className="st-statebar" role="group" aria-label="Fixture state to preview">{STATES.map(([k, l]) => <button key={k} aria-pressed={fx === k} onClick={() => setFx(k)}>{l}</button>)}</div></div>
          ) : null}
          <div className="st-conn"><Connection /></div>
          <ConnectionNotice />
          {children}
        </div>
        <nav className="st-bottomnav" aria-label="Main">
          {BOTTOM.map((n) => <Link key={n.href} href={n.href} aria-current={cur(n.href)}><n.icon size={20} aria-hidden />{n.label}</Link>)}
          <button onClick={() => setMore(true)} aria-label="More pages"><MoreHorizontal size={20} aria-hidden />More</button>
        </nav>
        <Sheet open={more} onClose={() => setMore(false)} titleId="st-more-title">
          <h2 id="st-more-title" style={{ margin: 0 }}>All pages</h2>
          <div className="st-stack">{NAV.map((n) => <Link key={n.href} href={n.href} className="st-nav" aria-current={cur(n.href)} onClick={() => setMore(false)}><n.icon size={19} aria-hidden />{n.label}</Link>)}
            <Link href="/" className="st-nav" onClick={() => setMore(false)}>Classic app</Link></div>
        </Sheet>
      </div>
    </FixtureStateProvider>
  );
}
