"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO } from "@/api/query";
import { Badge, ProvenanceBadge } from "../primitives";
import { DemoBanner } from "../states";
import { Drawer } from "../overlay";
import { PageTransition } from "../motion";
import { CommandPalette } from "./CommandPalette";
import { NAV, crumbs, screenFor } from "./nav";

function Nav({ path, onNav }: { path: string; onNav?: () => void }) {
  return (
    <nav aria-label="Primary" className="space-y-4">
      {NAV.map((g) => (
        <div key={g.group}><p className="label px-3 pb-1">{g.group}</p>
          <ul className="space-y-0.5">{g.items.map((s) => { const active = s.route === "/" ? path === "/" : path === s.route || path.startsWith(`${s.route}/`) && !g.items.some((o) => o !== s && o.route.startsWith(s.route) && (path === o.route || path.startsWith(`${o.route}/`)));
            return <li key={s.n}><Link href={s.route} onClick={onNav} aria-current={active ? "page" : undefined} className={cn("block rounded-md px-3 py-1.5 text-sm", active ? "bg-surface-3 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}>{s.title}</Link></li>; })}</ul></div>))}
    </nav>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/", [menu, setMenu] = React.useState(false), [cmd, setCmd] = React.useState(false), [light, setLight] = React.useState(false);
  React.useEffect(() => { setLight(document.documentElement.classList.contains("light")); }, []);
  React.useEffect(() => { const h = (e: KeyboardEvent): void => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd(true); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  if (path === "/login") return <>{children}</>;
  const toggle = (): void => { const next = !light; setLight(next); document.documentElement.classList.toggle("light", next); try { localStorage.setItem("twins-theme", next ? "light" : "dark"); } catch { /* storage may be unavailable */ } };
  const trail = crumbs(path), here = screenFor(path);
  return (
    <div className="min-h-screen bg-bg text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-bg">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto border-r border-line bg-surface px-2 py-4 lg:block"><Link href="/" className="mb-5 block px-3 text-lg font-semibold tracking-tight">TWINS</Link><Nav path={path} /></aside>
      <Drawer open={menu} onClose={() => setMenu(false)} title="Navigation" width="max-w-xs"><Nav path={path} onNav={() => setMenu(false)} /></Drawer>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur sm:px-5">
          <button type="button" aria-label="Open navigation" onClick={() => setMenu(true)} className="rounded-md p-2 text-fg-muted hover:bg-surface-2 lg:hidden"><Menu className="h-5 w-5" /></button>
          <ol aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-fg-muted sm:flex">{trail.map((c, i) => <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden>/</span>}{c.href ? <Link href={c.href} className="hover:text-fg">{c.label}</Link> : <span aria-current={i === trail.length - 1 ? "page" : undefined} className={i === trail.length - 1 ? "text-fg" : ""}>{c.label}</span>}</li>)}</ol>
          <span title={here?.title} className="flex-1 truncate text-sm font-medium sm:hidden">{here?.title ?? "TWINS"}</span>
          <div className="flex items-center gap-2">
            <Badge tone="info" title="All execution in this app is simulated paper trading. Live execution is disabled.">PAPER</Badge>
            {DEMO && <ProvenanceBadge kind="DEMO" />}
            <button type="button" onClick={() => setCmd(true)} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-fg-muted hover:text-fg"><Search className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Search</span><span className="sr-only sm:hidden">Search screens</span><kbd aria-hidden className="num hidden rounded border border-line px-1 text-[10px] sm:inline">⌘K</kbd></button>
            <button type="button" aria-label={light ? "Switch to dark theme" : "Switch to light theme"} onClick={toggle} className="rounded-md p-2 text-fg-muted hover:bg-surface-2">{light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">{DEMO && <div className="mb-4"><DemoBanner /></div>}<PageTransition>{children}</PageTransition></main>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}
