"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  TrendingUp,
  Layers,
  HardDrive,
  ShieldCheck,
  Settings,
  Lock,
  Radio,
  Sparkles,
  Radar,
  ClipboardCheck,
  Briefcase,
  LineChart,
  History,
  Bot,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoaded } from "@/components/trading/hooks";
import { getPaperStatus } from "@/services/trading";

interface SidebarProps {
  onNavClick?: () => void;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeStyle?: "acid" | "royal" | "neutral";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Trading",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Signals", href: "/signals", icon: Radar },
      { name: "Approvals", href: "/approvals", icon: ClipboardCheck, badge: "Human", badgeStyle: "acid" },
      { name: "Positions", href: "/positions", icon: Briefcase, badge: "Paper", badgeStyle: "royal" },
      { name: "P&L", href: "/pnl", icon: LineChart },
      { name: "History", href: "/history", icon: History },
    ],
  },
  {
    label: "Data",
    items: [
      { name: "Telegram Intake", href: "/intake", icon: Send },
      { name: "Market data", href: "/market", icon: TrendingUp },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Agents", href: "/agents", icon: Bot, badge: "Shadow", badgeStyle: "royal" },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onNavClick, className }: SidebarProps) {
  const pathname = usePathname();
  const { loaded } = useLoaded(getPaperStatus, 60_000);
  const live = loaded?.source === "live";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-slate-200/90 select-none",
        className
      )}
    >
      {/* Refined Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3.5 group"
        >
          {/* Logo Mark: Saturated Royal Blue with Twin Pillars & Acid Dot */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-royal-700 shadow-hero transition-transform duration-200 group-hover:scale-105">
            {/* Custom Twin Pillars */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4.5 bg-white rounded-full" />
              <span className="w-1.5 h-4.5 bg-white/80 rounded-full" />
            </div>
            {/* Acid-Lime Precision Highlight */}
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-acid-400 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-ink text-base tracking-tight font-sans">
                TWINS
              </span>
              <span className="rounded bg-royal-50 px-1.5 py-0.5 text-[9px] font-bold text-royal-700 border border-royal-200/50 uppercase tracking-wider">
                Proto
              </span>
            </div>
            <p className="text-[11px] text-ink-muted font-medium tracking-tight">
              Trading Intelligence OS
            </p>
          </div>
        </Link>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              {group.label}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    className={cn(
                      "group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-royal-50/80 text-royal-900 font-semibold shadow-xs"
                        : "text-ink-secondary hover:text-ink hover:bg-slate-50/80"
                    )}
                  >
                    {/* Active Edge Pill */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-royal-600" />
                    )}

                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-royal-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-2xs",
                          item.badgeStyle === "acid" &&
                            "bg-acid-100 text-acid-700 border border-acid-300 ring-2 ring-acid-200/40",
                          item.badgeStyle === "royal" &&
                            "bg-royal-100 text-royal-800 border border-royal-200",
                          item.badgeStyle === "neutral" &&
                            "bg-slate-100 text-slate-600 border border-slate-200"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Distinctive Bottom Environment Panel */}
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-2xl bg-canvas p-3.5 border border-slate-200/80 shadow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-[11px] font-bold text-ink tracking-tight">
                {live ? "Live workspace" : "Not connected"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-ink-muted">
              v0.2.0
            </span>
          </div>

          <p className="text-[11px] text-ink-secondary leading-snug">
            {live ? "Connected to the backend, read-only. Paper trading only; no real order can be placed." : "Backend not connected: nothing is shown. No real order can be placed."}
          </p>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-ink-muted font-mono">
            <span className="flex items-center gap-1 text-slate-500">
              <Lock className="h-3 w-3 text-amber-500" />
              <span>RO Enforced</span>
            </span>
            <span className="text-royal-700 font-semibold">Sandbox</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
