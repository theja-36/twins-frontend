"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Layers, LayoutDashboard, Radio, Settings, Wallet, LineChart, FlaskConical } from "lucide-react";
import React from "react";
import { FixtureStateProvider, STATES, type FixtureState } from "@/studio/state";

const MAIN = [
  { href: "/studio", label: "Overview", icon: LayoutDashboard },
  { href: "/studio/deck", label: "Decision Deck", icon: Layers },
  { href: "/studio/signals", label: "Signals", icon: Radio },
] as const;
const LATER = [{ label: "Market", icon: LineChart }, { label: "Portfolio", icon: Wallet }, { label: "Settings", icon: Settings }] as const;

export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [fx, setFx] = React.useState<FixtureState>("populated");
  React.useEffect(() => { const q = new URLSearchParams(location.search).get("fx"); const hit = STATES.find(([k]) => k === q); if (hit) setFx(hit[0]); }, []);
  const cur = (h: string): "page" | undefined => (h === "/studio" ? (path === "/studio" ? "page" : undefined) : path.startsWith(h) ? "page" : undefined);
  return (
    <div className="st-shell">
      <aside className="st-side" aria-label="Main">
        <div className="st-brand"><span className="st-logo"><Bell size={17} aria-hidden /></span>TWINS</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="st-navgroup">Workspace</div>
          {MAIN.map((n) => <Link key={n.href} href={n.href} className="st-nav" aria-current={cur(n.href)}><n.icon size={19} aria-hidden />{n.label}</Link>)}
          <div className="st-navgroup">Next pages</div>
          {LATER.map((n) => <span key={n.label} className="st-nav" aria-disabled="true"><n.icon size={19} aria-hidden />{n.label}<small>after approval</small></span>)}
        </nav>
        <div className="st-sidefoot"><strong>Read-only.</strong> Approving happens in the Telegram approval bot. Nothing here can place an order.</div>
      </aside>
      <div className="st-main">
        <div className="st-fixture" role="note"><FlaskConical size={18} aria-hidden />Visual prototype with TEST FIXTURES: every number on these pages is invented. Not connected to the backend.
          <div className="st-statebar" role="group" aria-label="Fixture state to preview">{STATES.map(([k, l]) => <button key={k} aria-pressed={fx === k} onClick={() => setFx(k)}>{l}</button>)}</div></div>
        <FixtureStateProvider value={fx}>{children}</FixtureStateProvider>
      </div>
      <nav className="st-bottomnav" aria-label="Main">
        {MAIN.map((n) => <Link key={n.href} href={n.href} aria-current={cur(n.href)}><n.icon size={20} aria-hidden />{n.label.replace("Decision ", "")}</Link>)}
        <span aria-disabled="true" style={{ opacity: .5 }}><Settings size={20} aria-hidden />More</span>
      </nav>
    </div>
  );
}
