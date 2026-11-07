"use client";

import React from "react";
import { Menu } from "lucide-react";
import { useLoaded } from "@/components/trading/hooks";
import { getPaperStatus } from "@/services/trading";
import { controlOf, getSystemConfig } from "@/services/system";
import { NotificationsBell } from "./NotificationsBell";
import { useBackendState } from "@/services/backendState";
import { ThemeToggle } from "./ThemeToggle";
import { PulseDot } from "@/components/motion/Motion";
import { formatCountdown, sessionAt } from "@/lib/marketHours";
import { istClock, safetyFlags, type FlagTone } from "@/lib/cockpit";
import { cn } from "@/lib/utils";

const TONE: Record<FlagTone, string> = { ok: "text-emerald-500", warn: "text-amber-500", bad: "text-rose-500", off: "text-slate-400" };

/** Safety strip: the six posture flags as compact chips. Unreadable controls are shown as such, never as a safe-looking default. */
export function SafetyStrip({ className }: { className?: string }) {
  const { loaded } = useLoaded(getSystemConfig, 60_000);
  const c = loaded?.data;
  const flags = c ? safetyFlags({ paperEffective: c.paperTrading.effective === true, engineEnabled: c.agentEngine.enabled === true, engineShadow: c.agentEngine.shadow === true, kill: controlOf(c.runtimeControls, "killSwitchActive"), intake: controlOf(c.runtimeControls, "intakeEnabled") }) : null;
  return (
    <ul className={cn("flex items-center gap-1.5 overflow-x-auto", className)} aria-label="Safety posture">
      {!flags ? <li className="font-mono text-[11px] text-slate-400">safety: loading</li> : flags.map((f) => (
        <li key={f.key} className="flex shrink-0 items-center gap-1.5 rounded border border-slate-200/80 px-1.5 py-0.5 font-mono text-[11px]">
          <span className={cn("h-1.5 w-1.5 rounded-full bg-current", TONE[f.tone])} aria-hidden />
          <span className="text-slate-500">{f.label}</span><span className={cn("font-semibold", f.tone === "ok" ? "text-ink" : TONE[f.tone])}>{f.value}</span>
        </li>))}
    </ul>
  );
}

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { loaded } = useLoaded(getPaperStatus, 30_000);
  const backend = useBackendState();
  const live = loaded?.source === "live" && backend.error === null;
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => { setNow(new Date()); const t = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(t); }, []);
  const s = now ? sessionAt(now) : null;
  const tone = s ? ({ open: "ok", pre_open: "warn", closed: "off", weekend: "off" } as const)[s.state] : "off";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-canvas/90 backdrop-blur-md">
      <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
        <button onClick={onOpenMobileMenu} className="-ml-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-50 hover:text-ink lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <span className="font-mono text-sm font-semibold tracking-[0.2em] text-ink lg:hidden">TWINS</span>
        <div className="hidden items-center gap-2 text-xs lg:flex" aria-label="Market status">
          <PulseDot tone={tone} live={s?.state === "open"} label={s?.label ?? "market status"} />
          <span className="font-medium text-ink">{s ? s.label : "—"}</span>
          {s ? <span className="font-mono text-slate-500">{formatCountdown(s.secondsToChange)} to {s.nextLabel.replace(/^market /, "")}</span> : null}
        </div>
        <div className="hidden h-4 w-px bg-slate-200/80 lg:block" aria-hidden />
        <time className="hidden font-mono text-xs text-slate-500 sm:block" aria-label="India Standard Time">{now ? istClock(now) : "--:--:--"} <span className="text-slate-400">IST</span></time>
        <div className="hidden h-4 w-px bg-slate-200/80 xl:block" aria-hidden />
        <SafetyStrip className="hidden xl:flex" />
        <div className="ml-auto flex items-center gap-2">
          <span className={cn("flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px]", live ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500")} title={live ? "The backend answers (read-only, paper only)" : "The backend does not answer"}>
            <span className={cn("h-1.5 w-1.5 rounded-full bg-current", live && "animate-pulse")} />{live ? "LIVE DATA" : backend.error === null || backend.error === "not_configured" ? "NO BACKEND" : "BACKEND ISSUE"}
          </span>
          <ThemeToggle /><NotificationsBell />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200/80 px-3 py-1.5 xl:hidden"><SafetyStrip /></div>
    </header>
  );
}
