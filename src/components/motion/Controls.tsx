"use client";

import React from "react";

/** Accessible switch: a button with role=switch, space/enter toggles, visible focus ring. `disabledReason` explains why it cannot change (also announced). */
export function Toggle({ checked, onChange, label, disabledReason }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabledReason?: string }) {
  const disabled = Boolean(disabledReason);
  const id = React.useId();
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} aria-describedby={disabled ? `${id}-why` : undefined} disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-royal-500" : "bg-slate-200"}`}>
        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      <label htmlFor={id}>{label}</label>
      {disabled ? <span id={`${id}-why`} className="text-xs text-slate-400">{disabledReason}</span> : null}
    </span>
  );
}

/** CSS tooltip that also opens on keyboard focus. Content must be short text. */
export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-max max-w-[16rem] -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">{text}</span>
    </span>
  );
}

/** Small count/state pill. */
export function Pill({ tone = "mute", children }: { tone?: "ok" | "warn" | "bad" | "info" | "mute"; children: React.ReactNode }) {
  const t = { ok: "bg-emerald-50 text-emerald-700 border-emerald-200", warn: "bg-amber-50 text-amber-800 border-amber-200", bad: "bg-rose-50 text-rose-700 border-rose-200", info: "bg-royal-50 text-royal-700 border-royal-200", mute: "bg-slate-100 text-slate-600 border-slate-200" }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

/** Marks content that is sample data because its backend is not connected yet. */
export function SampleBadge({ note = "Sample data: this feed is not connected yet" }: { note?: string }) {
  return <span title={note} className="inline-flex items-center rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">SAMPLE · {note}</span>;
}
