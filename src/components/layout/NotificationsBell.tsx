"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLoaded } from "@/components/trading/hooks";
import { ago } from "@/services/trading";
import { getNotifications } from "@/services/system";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = { critical: "bg-rose-500", warning: "bg-amber-500", info: "bg-royal-500" };

/** Header bell: the latest system events from the backend (or labelled samples). A dot appears for warnings / criticals in the last 24 h. Read-only. */
export function NotificationsBell() {
  const { loaded } = useLoaded(() => getNotifications(30), 30_000);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  const items = loaded?.data.items ?? [];
  const hot = items.filter((n) => n.severity !== "info" && Date.now() - Date.parse(n.at) < 86_400_000).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" aria-expanded={open} title="Notifications" className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-ink-secondary shadow-2xs transition-all hover:border-slate-300 hover:text-ink">
        <Bell className="h-4 w-4" />
        {hot > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-royal-600 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-dropdown">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="text-sm font-semibold text-ink">Notifications</p><span className="text-[11px] text-slate-400">live</span></div>
          {items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing has happened yet.</p> : (
            <ul className="max-h-80 divide-y divide-slate-50 overflow-y-auto">{items.slice(0, 6).map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3"><span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[n.severity])} /><div className="min-w-0"><p className="text-[13px] font-medium leading-snug text-ink">{n.title}</p><p className="mt-0.5 truncate text-xs text-slate-400">{ago(n.at)}{n.detail ? ` · ${n.detail}` : ""}</p></div></li>
            ))}</ul>
          )}
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-royal-700 hover:bg-slate-50">See all</Link>
        </div>
      )}
    </div>
  );
}
