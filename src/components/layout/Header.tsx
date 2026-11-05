"use client";

import React from "react";
import { useLoaded } from "@/components/trading/hooks";
import { getPaperStatus } from "@/services/trading";
import { NotificationsBell } from "./NotificationsBell";
import { useBackendState } from "@/services/backendState";
import { ThemeToggle } from "./ThemeToggle";
import {
  Menu,
  Search,
  Lock,
  Calendar,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { loaded } = useLoaded(getPaperStatus, 30_000);
  const backend = useBackendState();
  const live = loaded?.source === "live" && backend.error === null;
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-canvas/90 px-4 sm:px-8 backdrop-blur-md">
      {/* Left: Mobile Menu + Editorial Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-ink hover:bg-white border border-transparent hover:border-slate-200 lg:hidden transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
              Your intelligence workspace
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-royal-700 border border-royal-200/70 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-royal-600" />
              Paper mode
            </span>
          </div>
          <p className="hidden sm:flex items-center gap-2 text-xs text-ink-muted mt-0.5 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} • staging</span>
            </span>
            <span>•</span>
            <span>Live trading locked</span>
          </p>
        </div>
      </div>

      {/* Right: Search UI + Persistent Demo Status + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search Bar */}
        <div className="hidden lg:flex items-center relative w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search signals, tickers..."
            className="w-full h-8.5 rounded-xl border border-slate-200/90 bg-white pl-8.5 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-royal-500 focus:outline-none focus:ring-2 focus:ring-royal-500/15 shadow-2xs transition-all"
          />
        </div>

        {/* Environment indicator: green when the backend answers, red when it does not (there is no sample data) */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs ${live ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          <span className={`h-2 w-2 rounded-full animate-pulse ${live ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="hidden sm:inline">{live ? "Live backend" : backend.error === "not_configured" || backend.error === null ? "No backend" : "Backend problem"}</span>
          <span className={`text-[10px] font-normal hidden md:inline ${live ? "text-emerald-700/80" : "text-rose-700/80"}`}>{live ? "(paper only)" : backend.error === "not_configured" || backend.error === null ? "(nothing shown)" : "(see banner)"}</span>
        </div>

        <ThemeToggle />
        <NotificationsBell />

        {/* Auditor Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-royal-700 text-white text-xs font-bold shadow-xs">
            SA
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-ink leading-none">
              Sara A.
            </div>
            <div className="text-[10px] text-ink-muted font-medium mt-0.5">
              Read-Only Auditor
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
