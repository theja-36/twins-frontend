import React from "react";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

export function AuditSecurityBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-surface to-slate-900/60 p-3.5 px-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
                Safe Audit-First Mode Active
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                READ-ONLY ENFORCED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live orders are hardware-isolated. Signals from Telegram & Kite are ingested for intelligence & decision review only.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/50">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SHA-256 Merkle Audit Chain Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
