"use client";
import React from "react";
import { cn } from "@/lib/utils";

/** Accessible switch. `disabledReason` explains (visibly and to screen readers) why it cannot change. */
export function Toggle({ checked, onChange, label, disabledReason }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabledReason?: string }) {
  const id = React.useId(), disabled = Boolean(disabledReason);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} aria-describedby={disabled ? `${id}-why` : undefined} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full border border-line-strong transition-colors disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-accent" : "bg-surface-3")}>
        <span className={cn("absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-fg transition-transform", checked && "translate-x-4")} />
      </button>
      <label htmlFor={id} className="text-fg">{label}</label>
      {disabled ? <span id={`${id}-why`} className="text-xs text-fg-faint">{disabledReason}</span> : null}
    </span>
  );
}
/** Tooltip that also opens on keyboard focus. Content is short plain text. */
export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-max max-w-[16rem] -translate-x-1/2 rounded border border-line-strong bg-surface-3 px-2 py-1 text-xs text-fg shadow-lg group-focus-within:block group-hover:block">{text}</span>
    </span>
  );
}
/** Single-choice segmented control (radio group semantics) used for filters such as dataset, mode, range. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={o.disabled} onClick={() => onChange(o.value)}
          className={cn("rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40", value === o.value ? "bg-surface-3 text-fg shadow-sm" : "text-fg-muted hover:text-fg")}>{o.label}</button>
      ))}
    </div>
  );
}
export const DATE_RANGES = [{ value: "1d", label: "1D" }, { value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "90d", label: "90D" }, { value: "all", label: "All" }] as const;
export type DateRangeKey = (typeof DATE_RANGES)[number]["value"];
export const rangeCutoff = (r: DateRangeKey, now = Date.now()): number | null => (r === "all" ? null : now - { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[r] * 86_400_000);
export function DateRange({ value, onChange }: { value: DateRangeKey; onChange: (v: DateRangeKey) => void }) { return <Segmented label="Date range" value={value} onChange={onChange} options={DATE_RANGES} />; }
export function SearchInput({ value, onChange, placeholder = "Search", label = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className="h-8 w-full min-w-0 rounded-md border border-line bg-surface-2 px-2.5 text-sm text-fg placeholder:text-fg-faint sm:w-56" />;
}
export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: ReadonlyArray<{ value: T; label: string }>; label: string }) {
  return <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label} className="h-8 rounded-md border border-line bg-surface-2 px-2 text-sm text-fg">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
