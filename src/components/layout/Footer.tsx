import React from "react";
import { ShieldCheck, HardDrive, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-terminal-border bg-surface-subtle/80 py-4 text-xs font-mono text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold text-white">TWINS CORE</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">v1.4.2-audit</span>
          </div>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            Telemetry: SHA-256 Ledger Verified
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KITE WS: CONNECTED</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>TELEGRAM BOT: LISTENING</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SAFE ISOLATION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
