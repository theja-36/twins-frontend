"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Modal } from "../overlay";
import { SCREENS } from "./nav";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter(), [q, setQ] = React.useState(""), [i, setI] = React.useState(0), ref = React.useRef<HTMLInputElement>(null);
  const items = React.useMemo(() => { const t = q.trim().toLowerCase(); return SCREENS.filter((s) => s.nav && (!t || `${s.title} ${s.group} ${s.keywords ?? ""}`.toLowerCase().includes(t))); }, [q]);
  React.useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => ref.current?.focus(), 0); } }, [open]);
  const go = (route: string): void => { onClose(); router.push(route); };
  return (
    <Modal open={open} onClose={onClose} title="Go to screen">
      <div className="space-y-2">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2"><Search className="h-4 w-4 text-fg-muted" aria-hidden /><span className="sr-only">Search screens</span>
          <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); } else if (e.key === "Enter" && items[i]) go(items[i]!.route); }} placeholder="Search screens…" role="combobox" aria-expanded aria-controls="cmd-list" aria-activedescendant={items[i] ? `cmd-${items[i]!.n}` : undefined} className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint" /></label>
        <ul id="cmd-list" role="listbox" aria-label="Screens" className="max-h-80 overflow-y-auto">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No screen matches “{q}”.</li>}
          {items.map((s, k) => <li key={s.n} id={`cmd-${s.n}`} role="option" aria-selected={k === i} onMouseEnter={() => setI(k)} onClick={() => go(s.route)} className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${k === i ? "bg-surface-3 text-fg" : "text-fg-muted"}`}><span>{s.title}</span><span className="text-xs text-fg-faint">{s.group}</span></li>)}
        </ul>
      </div>
    </Modal>
  );
}
