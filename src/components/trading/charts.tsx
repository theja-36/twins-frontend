"use client";

import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import type { CurvePoint } from "@/lib/portfolio";

/** Recharts wrappers in the design system's colours. Every chart names its meaning in `aria-label`; `isAnimationActive` follows prefers-reduced-motion. */
const AXIS = { fontSize: 11, fill: "#8E9BB5" } as const;
const GRID = "rgba(142,155,181,0.18)";
const BLUE = "#00D4AA", GREEN = "#00D4AA", RED = "#FF4757";

const tip = { contentStyle: { background: "#10131A", border: "1px solid #232A36", borderRadius: 8, color: "#E8ECF4", fontSize: 12 }, labelStyle: { color: "#AAB5CA" }, cursor: { stroke: "#00D4AA", strokeOpacity: 0.3 } } as const;

export function EquityAreaChart({ curve, height = 220, metric = "pnl" }: { curve: readonly CurvePoint[]; height?: number; metric?: "pnl" | "r" }) {
  const reduce = useReducedMotion();
  const last = curve.length ? (curve[curve.length - 1] as CurvePoint)[metric] : 0;
  const color = last >= 0 ? GREEN : RED;
  const data = curve.map((p, i) => ({ n: i + 1, value: p[metric], drawdown: -p.drawdownR }));
  return (
    <div role="img" aria-label={`Cumulative ${metric === "pnl" ? "profit and loss" : "R"} over ${curve.length} closed trades, ending at ${last}`} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs><linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="n" tick={AXIS} tickLine={false} axisLine={false} label={{ value: "closed trade", position: "insideBottomRight", offset: -2, fill: "#8E9BB5", fontSize: 10 }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tip} formatter={(v: number) => [metric === "pnl" ? `₹${v.toLocaleString("en-IN")}` : `${v} R`, metric === "pnl" ? "Cumulative P&L" : "Cumulative R"]} labelFormatter={(n) => `Trade ${n}`} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#eqfill)" isAnimationActive={!reduce} animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ShareBars({ rows, height = 200, label }: { rows: ReadonlyArray<{ name: string; value: number; tone?: "up" | "down" | "flat" }>; height?: number; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...rows]} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={84} />
          <Tooltip {...tip} cursor={{ fill: "rgba(0,212,170,0.08)" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={!reduce} animationDuration={700}>
            {rows.map((r) => <Cell key={r.name} fill={r.tone === "down" ? RED : r.tone === "up" ? GREEN : BLUE} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
