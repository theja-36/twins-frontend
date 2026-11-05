import React from "react";
import { ShieldAlert, Info, Lock, Terminal } from "lucide-react";

export function SafetyStrip() {
  return (
    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 p-3.5 sm:px-5 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Indicator & Description */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Safety Protocol: Demo Environment
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-amber-300 text-amber-900 shadow-xs">
                PROTOTYPE ONLY
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-snug">
              Backend not connected. Live order routing and approval execution are hard-locked. All figures are simulated mock data.
            </p>
          </div>
        </div>

        {/* Right: Three explicit status pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0 border-t border-amber-200/60 lg:border-t-0 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Demo Data</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-xs">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Engine Disabled</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-800 text-xs font-medium shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Live Trading Disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
