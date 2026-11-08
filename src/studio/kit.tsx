"use client";
import React from "react";
import { AlertTriangle, CircleSlash, Inbox, Lock, X } from "lucide-react";
import type { Read } from "./data";
import { type Tone, ageText } from "./model";

/** Shared Studio components: headers, metric cards, badges, filter chips, tables, sheets, disclosures and every data state. */
export function Chip({ tone = "mute", children, title }: { tone?: Tone; children: React.ReactNode; title?: string }) { return <span className={`st-chip ${tone}`} title={title}>{children}</span>; }
export function SampleBadge({ children = "SAMPLE" }: { children?: React.ReactNode }) { return <span className="st-chip info" title="Illustrative text, not data from the backend">{children}</span>; }
export function PageHead({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return <header className="st-top"><div><h1>{title}</h1><p>{sub}</p></div>{right ? <div className="st-safety">{right}</div> : null}</header>;
}
export function Metric({ tone, label, value, foot }: { tone: "lav" | "mint" | "peach" | "white"; label: string; value: React.ReactNode; foot?: React.ReactNode }) {
  return <div className={`st-stat st-${tone}`}><span>{label}</span><strong className="num">{value}</strong>{foot ? <em>{foot}</em> : null}</div>;
}
export function Card({ title, sub, right, children, label }: { title?: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; label?: string }) {
  return <section className="st-card" aria-label={label ?? title}>{title ? <div className="st-cardtop"><div><h2>{title}</h2>{sub ? <p className="st-sub">{sub}</p> : null}</div>{right}</div> : null}{children}</section>;
}
export function Disclosure({ label, children, open = false }: { label: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="st-disc"><summary>{label}</summary><div className="st-discbody">{children}</div></details>;
}
export function Legend({ items }: { items: Array<[string, string]> }) { return <div className="st-legend">{items.map(([c, l]) => <span key={l}><i className="st-dot" style={{ background: c }} />{l}</span>)}</div>; }
export function HBar({ label, value, share, foot }: { label: string; value: string; share: number; foot?: string }) {
  return <div className="st-hbar"><div className="st-hbar-top"><b>{label}</b><span className="num">{value}</span></div><div className="st-hbar-track" role="img" aria-label={`${label} ${share.toFixed(0)} percent`}><i style={{ width: `${Math.max(2, Math.min(100, share))}%` }} /></div>{foot ? <small>{foot}</small> : null}</div>;
}

export function FilterGroup<V extends string>({ label, options, value, onChange }: { label: string; options: ReadonlyArray<readonly [V, string]>; value: V; onChange: (v: V) => void }) {
  return <div className="st-filters" role="group" aria-label={label}>{options.map(([k, l]) => <button key={k} className="st-fbtn" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}</div>;
}

/** Table on wide screens; each row becomes a labelled card on phones (CSS). Rows are keyboard-activatable. */
export interface Col<T> { key: string; label: string; render: (r: T) => React.ReactNode; className?: string }
export function Table<T>({ cols, rows, rowKey, onRow, caption, selected }: { cols: Array<Col<T>>; rows: readonly T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; caption: string; selected?: string | null }) {
  return (
    <div className="st-tablewrap"><table className="st-table"><caption className="st-sr">{caption}</caption>
      <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r) => {
        const k = rowKey(r);
        return <tr key={k} data-sel={selected === k} tabIndex={onRow ? 0 : undefined} onClick={onRow ? () => onRow(r) : undefined} onKeyDown={onRow ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRow(r); } } : undefined}>
          {cols.map((c) => <td key={c.key} data-label={c.label} className={c.className}>{c.render(r)}</td>)}</tr>;
      })}</tbody></table></div>
  );
}

/** Dialog / bottom sheet: fixed header with the close control, scrolling body, Escape, focus trap and focus return. */
export function Sheet({ open, onClose, titleId, children, label }: { open: boolean; onClose: () => void; titleId: string; children: React.ReactNode; label?: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent): void => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const f = [...ref.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input,summary,[tabindex='0']")].filter((x) => x.offsetParent !== null);
      if (f.length === 0) return;
      const first = f[0] as HTMLElement, last = f[f.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="st-scrim" onClick={onClose} aria-hidden />
      <aside ref={ref} className="st-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-label={label}>
        <div className="st-panel-head"><button ref={closeRef} className="st-iconbtn st-close" onClick={onClose} aria-label="Close"><X size={20} aria-hidden /></button></div>
        <div className="st-panel-body">{children}</div>
      </aside>
    </>
  );
}

export function Skeleton({ h = 120 }: { h?: number }) { return <div className="st-skel" style={{ height: h }} role="status" aria-label="Loading" />; }
export function Notice({ tone = "warn", title, children, action }: { tone?: "warn" | "bad" | "info"; title: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode }) {
  return <div className={`st-gap st-notice-${tone}`} role={tone === "bad" ? "alert" : "status"}><strong>{title}</strong>{children}{action ? <div style={{ marginTop: 10 }}>{action}</div> : null}</div>;
}
export function StaleBanner({ lastOkAt, what }: { lastOkAt: number | null; what: string }) {
  const sec = lastOkAt === null ? null : Math.round((Date.now() - lastOkAt) / 1000);
  return <Notice title="Showing the last good read">The latest refresh of {what} failed, so these figures are {ageText(sec)} and may no longer be true.</Notice>;
}

/** One gate for every read: loading, not configured, unauthorised, unreachable, invalid, unavailable (route absent), empty, stale, then the data. */
export function ReadGate<T>({ read, what, children, isEmpty, emptyHint, skeleton, unavailableHint }: {
  read: Read<T>; what: string; children: (data: T) => React.ReactNode; isEmpty?: (d: T) => boolean; emptyHint?: string; skeleton?: React.ReactNode; unavailableHint?: string;
}) {
  const retry = <button className="st-btn ghost" onClick={read.refresh}>Try again</button>;
  switch (read.status) {
    case "loading": return <>{skeleton ?? <Skeleton />}</>;
    case "unconfigured": return <p className="st-sub st-compact" role="status"><Lock size={13} aria-hidden /> Not connected: {what} cannot be read. Nothing is shown instead of made-up numbers.</p>;
    case "unauthorized": return <Notice tone="bad" title={`The backend refused the key for ${what}.`} action={retry}>Check the server-side API key. The key is never shown here.</Notice>;
    case "unreachable": return <Notice tone="bad" title={<><AlertTriangle size={14} aria-hidden style={{ verticalAlign: -2 }} /> Could not load {what}.</>} action={retry}>The backend did not answer. This is an error, not an empty result, and nothing is assumed to be fine.</Notice>;
    case "invalid": return <Notice tone="bad" title={`The backend sent an unexpected answer for ${what}.`} action={retry}>The data was not used. This is different from having nothing to show.</Notice>;
    case "absent": return <Notice tone="info" title={<><CircleSlash size={14} aria-hidden style={{ verticalAlign: -2 }} /> {what} is not available on this backend.</>}>{unavailableHint ?? "The backend does not offer this read yet. It becomes available after a backend update."}</Notice>;
    case "ok": {
      const d = read.data as T;
      if (isEmpty?.(d)) return <div className="st-empty"><Inbox size={28} aria-hidden /><h3>No {what} yet</h3><p>{emptyHint ?? "The backend answered and there is nothing to show. That is different from an error."}</p></div>;
      return <>{read.stale ? <div style={{ marginBottom: 12 }}><StaleBanner lastOkAt={read.lastOkAt} what={what} /></div> : null}{children(d)}</>;
    }
  }
}
