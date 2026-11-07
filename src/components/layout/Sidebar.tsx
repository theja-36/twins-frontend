"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, Briefcase, ClipboardCheck, FileCheck2, History, LayoutDashboard, LineChart, Radar, Radio, Send, Settings, Table2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { name: string; href: string; icon: React.ComponentType<{ className?: string }> }
const GROUPS: NavItem[][] = [
  [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Market", href: "/market", icon: TrendingUp },
    { name: "Channels", href: "/channels", icon: Radio },
    { name: "Claims", href: "/claims", icon: Table2 },
    { name: "Decisions", href: "/decisions", icon: FileCheck2 },
    { name: "Portfolio", href: "/positions", icon: Briefcase },
  ],
  [
    { name: "Signals", href: "/signals", icon: Radar },
    { name: "Approvals", href: "/approvals", icon: ClipboardCheck },
    { name: "P&L", href: "/pnl", icon: LineChart },
    { name: "History", href: "/history", icon: History },
    { name: "Intake", href: "/intake", icon: Send },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ],
  [{ name: "Settings", href: "/settings", icon: Settings }],
];
export const NAV_ITEMS: readonly NavItem[] = GROUPS.flat();

/** Slim icon rail (56 px). Labels appear as tooltips on hover and focus; `expanded` (mobile drawer) shows them inline. */
export function Sidebar({ onNavClick, expanded = false }: { onNavClick?: () => void; expanded?: boolean }) {
  const pathname = usePathname();
  const active = (href: string): boolean => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <aside className="flex h-full flex-col border-r border-slate-200/80 bg-white select-none" aria-label="Primary">
      <Link href="/" onClick={onNavClick} aria-label="TWINS home" className={cn("flex h-12 items-center border-b border-slate-200/80", expanded ? "gap-3 px-4" : "justify-center")}>
        <span className="relative grid h-7 w-7 place-items-center rounded-md bg-royal-500 text-[13px] font-extrabold text-[#06130F]" aria-hidden>T</span>
        {expanded ? <span className="font-mono text-sm font-semibold tracking-[0.2em] text-ink">TWINS</span> : null}
      </Link>
      <nav className="flex-1 overflow-y-auto py-2">
        {GROUPS.map((group, gi) => (
          <ul key={gi} className={cn("space-y-0.5 px-2 py-1", gi > 0 && "mt-1 border-t border-slate-200/80 pt-2")}>
            {group.map((item) => {
              const on = active(item.href), Icon = item.icon;
              return (
                <li key={item.href} className="relative">
                  <Link href={item.href} onClick={onNavClick} aria-label={item.name} aria-current={on ? "page" : undefined}
                    className={cn("group relative flex h-9 items-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-royal-500", expanded ? "gap-3 px-3 text-sm" : "justify-center", on && "bg-slate-50 text-ink")}>
                    {on ? <span className="absolute left-[-8px] top-1.5 h-6 w-[2px] rounded-r bg-royal-500" aria-hidden /> : null}
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", on && "text-royal-500")} />
                    {expanded ? <span>{item.name}</span> : (
                      <span role="tooltip" className="pointer-events-none absolute left-full z-40 ml-2 whitespace-nowrap rounded-md border border-slate-200/80 bg-white px-2 py-1 text-xs font-medium text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>
      <div className={cn("border-t border-slate-200/80 py-2 text-center font-mono text-[10px] text-slate-400", expanded && "px-4 text-left")}>paper · RO</div>
    </aside>
  );
}
