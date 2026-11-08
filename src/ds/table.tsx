"use client";
import React from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./states";
import { SearchInput } from "./controls";

export interface Col<R> { key: string; header: string; render: (r: R) => React.ReactNode; sort?: (r: R) => string | number | null; align?: "left" | "right"; className?: string; hideBelow?: "sm" | "md" }
/** Financial table: sticky header, sortable, optional text filter + pagination, numbers right-aligned in tabular mono, horizontal scroll inside its own container on small screens. */
export function DataTable<R>({ rows, cols, rowKey, label, pageSize = 15, filterText, onRow, empty = "No rows match.", dense = false }: { rows: readonly R[]; cols: ReadonlyArray<Col<R>>; rowKey: (r: R) => string; label: string; pageSize?: number; filterText?: (r: R) => string; onRow?: (r: R) => void; empty?: string; dense?: boolean }) {
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null), [page, setPage] = React.useState(0), [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => (filterText && q.trim() ? rows.filter((r) => filterText(r).toLowerCase().includes(q.trim().toLowerCase())) : rows), [rows, q, filterText]);
  const sorted = React.useMemo(() => {
    const c = sort ? cols.find((x) => x.key === sort.key) : undefined; if (!sort || !c?.sort) return filtered;
    const f = c.sort; return [...filtered].sort((a, b) => { const x = f(a), y = f(b); if (x === y) return 0; if (x === null) return 1; if (y === null) return -1; return (x < y ? -1 : 1) * sort.dir; });
  }, [filtered, sort, cols]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)), cur = Math.min(page, pages - 1), slice = sorted.slice(cur * pageSize, cur * pageSize + pageSize);
  return (
    <div className="space-y-2">
      {filterText && <div className="max-w-xs"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder={`Filter ${label.toLowerCase()}`} label={`Filter ${label}`} /></div>}
      {sorted.length === 0 ? <EmptyState title={empty} /> : (
        <div role="region" aria-label={`${label} (scrollable)`} tabIndex={0} className="overflow-x-auto rounded-lg border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">{label}</caption>
            <thead className="sticky top-0 bg-surface-2 text-left"><tr>{cols.map((c) => {
              const active = sort?.key === c.key;
              return <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : undefined} className={cn("label whitespace-nowrap px-3 py-2 font-medium", c.align === "right" && "text-right", c.hideBelow === "sm" && "hidden sm:table-cell", c.hideBelow === "md" && "hidden md:table-cell")}>
                {c.sort ? <button type="button" onClick={() => setSort(active && sort!.dir === -1 ? null : { key: c.key, dir: active ? -1 : 1 })} className="inline-flex items-center gap-1 rounded hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">{c.header}{active && (sort!.dir === 1 ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}</button> : c.header}
              </th>; })}</tr></thead>
            <tbody className="divide-y divide-line">{slice.map((r) => (
              <tr key={rowKey(r)} onClick={onRow ? () => onRow(r) : undefined} className={cn("bg-surface", onRow && "cursor-pointer hover:bg-surface-2")}>
                {cols.map((c) => <td key={c.key} className={cn(dense ? "px-3 py-1.5" : "px-3 py-2.5", c.align === "right" && "num text-right", c.hideBelow === "sm" && "hidden sm:table-cell", c.hideBelow === "md" && "hidden md:table-cell", c.className)}>{c.render(r)}</td>)}
              </tr>))}</tbody>
          </table>
        </div>)}
      {pages > 1 && <nav aria-label={`${label} pages`} className="flex items-center justify-between text-xs text-fg-muted"><span>{sorted.length} rows · page {cur + 1} of {pages}</span>
        <span className="flex gap-1"><button type="button" aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded border border-line p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded border border-line p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></span></nav>}
    </div>
  );
}
