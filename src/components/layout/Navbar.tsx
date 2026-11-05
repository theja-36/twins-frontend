"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Layers,
  TrendingUp,
  Settings,
  Shield,
  Radio,
  Send,
  Zap,
  Menu,
  X,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { twinsApi } from "@/services/api";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(3);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    twinsApi.getDecisions().then((decisions) => {
      const pending = decisions.filter((d) => d.status === "PENDING_APPROVAL").length;
      setPendingCount(pending);
    });

    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Activity,
      badge: null,
    },
    {
      name: "Decisions & Approvals",
      href: "/decisions",
      icon: Layers,
      badge: pendingCount > 0 ? `${pendingCount} PENDING` : null,
      badgeColor: "amber",
    },
    {
      name: "Market Data",
      href: "/market",
      icon: TrendingUp,
      badge: "KITE LIVE",
      badgeColor: "cyan",
    },
    {
      name: "Settings & Config",
      href: "/settings",
      icon: Settings,
      badge: "READ-ONLY",
      badgeColor: "slate",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-terminal-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-600/30 border border-cyan-500/40 group-hover:border-cyan-400 transition-colors">
              <Zap className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-bold tracking-tight text-white">
                  TWINS
                </span>
                <span className="rounded bg-terminal-border px-1.5 py-0.2 text-[10px] font-mono text-cyan-400">
                  INTEL
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wider hidden sm:block">
                PERSONAL TRADING SYSTEM
              </p>
            </div>
          </Link>

          {/* Read-Only Safety Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
            <Shield className="h-3 w-3 text-amber-400" />
            <span>READ-ONLY AUDIT LOCK</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all duration-150",
                  isActive
                    ? "bg-surface-elevated text-cyan-400 border border-terminal-borderLight shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-surface/80"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-cyan-400" : "text-slate-400")} />
                <span>{item.name}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-mono font-bold tracking-wider",
                      item.badgeColor === "amber" && "bg-amber-500/20 text-amber-400 border border-amber-500/40",
                      item.badgeColor === "cyan" && "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
                      item.badgeColor === "slate" && "bg-slate-800 text-slate-400 border border-slate-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Feed Status Indicators */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface border border-terminal-border text-xs font-mono">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Kite Feed:</span>
            <span className="text-emerald-400 font-semibold">STREAMING</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface border border-terminal-border text-xs font-mono">
            <Send className="h-3 w-3 text-purple-400" />
            <span className="text-slate-400">TG:</span>
            <span className="text-purple-400 font-semibold">SYNCED</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface border border-terminal-border"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-terminal-border bg-surface-subtle px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-mono",
                  isActive
                    ? "bg-surface-elevated text-cyan-400 border border-terminal-borderLight"
                    : "text-slate-300 hover:bg-surface hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono",
                      item.badgeColor === "amber" && "bg-amber-500/20 text-amber-400",
                      item.badgeColor === "cyan" && "bg-cyan-500/20 text-cyan-300",
                      item.badgeColor === "slate" && "bg-slate-800 text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-terminal-border flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Kite Feed: LIVE</span>
            <span className="text-amber-400">SAFE AUDIT MODE</span>
          </div>
        </div>
      )}
    </header>
  );
}
