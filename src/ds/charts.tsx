"use client";
import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardBody, CardHeader } from "./primitives";

/** Chart container: titled card, an accessible text summary, and a visually-hidden data table so the numbers never live only in the picture. Values are charted as display numbers only; the exact decimal strings remain in the table. */
export function ChartCard({ title, subtitle, summary, children, table }: { title: string; subtitle?: string; summary: string; children: React.ReactNode; table: { headers: string[]; rows: Array<Array<string>> } }) {
  return (
    <Card label={title}><CardHeader title={title} subtitle={subtitle} />
      <CardBody><div role="img" aria-label={summary} className="h-56 w-full">{children}</div>
        <details className="mt-2 text-xs text-fg-muted"><summary className="cursor-pointer">View data table</summary>
          <div className="mt-1 max-h-40 overflow-auto"><table className="w-full"><thead><tr>{table.headers.map((h) => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}</tr></thead><tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="num px-2 py-1">{c}</td>)}</tr>)}</tbody></table></div></details>
      </CardBody></Card>
  );
}
const AX = { stroke: "rgb(var(--fg-faint))", fontSize: 11 } as const;
const TIP = { contentStyle: { background: "rgb(var(--surface-2))", border: "1px solid rgb(var(--line))", borderRadius: 8, fontSize: 12, color: "rgb(var(--fg))" } } as const;
export function LineArea({ data, xKey, yKey, color = "accent" }: { data: Array<Record<string, string | number>>; xKey: string; yKey: string; color?: "accent" | "pos" | "neg" }) {
  const c = `rgb(var(--${color}))`;
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey={xKey} tick={AX} tickLine={false} axisLine={false} /><YAxis tick={AX} tickLine={false} axisLine={false} width={48} /><Tooltip {...TIP} /><Area type="monotone" dataKey={yKey} stroke={c} fill={c} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>;
}
export function Bars({ data, xKey, yKey }: { data: Array<Record<string, string | number>>; xKey: string; yKey: string }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey={xKey} tick={AX} tickLine={false} axisLine={false} /><YAxis tick={AX} tickLine={false} axisLine={false} width={40} /><Tooltip {...TIP} /><Bar dataKey={yKey} fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>;
}
