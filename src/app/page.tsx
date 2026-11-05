"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  Radio,
  Layers,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowRight,
  Copy,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Info,
  Clock,
  Activity,
  Zap,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PaperStrip } from "@/components/trading/PaperStrip";

// 24-hour intake data points
const hourlyData = [
  { hour: "00:00", count: 12, topChannel: "Nightly Summary" },
  { hour: "02:00", count: 6, topChannel: "FX Pulse" },
  { hour: "04:00", count: 8, topChannel: "Pre-market Scanner" },
  { hour: "06:00", count: 22, topChannel: "Morning Briefings" },
  { hour: "08:00", count: 68, topChannel: "Institutional Flow" },
  { hour: "09:00", count: 124, topChannel: "Institutional Flow" },
  { hour: "10:00", count: 142, topChannel: "Institutional Flow (Peak)" },
  { hour: "11:00", count: 118, topChannel: "Macro Derivatives" },
  { hour: "12:00", count: 96, topChannel: "Macro Derivatives" },
  { hour: "13:00", count: 82, topChannel: "Commodity Pulse" },
  { hour: "14:00", count: 104, topChannel: "Institutional Flow" },
  { hour: "15:00", count: 136, topChannel: "Closing Flow" },
  { hour: "16:00", count: 78, topChannel: "Post-market Scanners" },
  { hour: "18:00", count: 44, topChannel: "Corporate Filings" },
  { hour: "20:00", count: 62, topChannel: "Derivatives Wrap" },
  { hour: "22:00", count: 32, topChannel: "Global Cues" },
];

const mockRecentDecisions = [
  {
    id: "DEC-0891",
    ticker: "RELIANCE",
    action: "BUY",
    sourceChannel: "Institutional Flow Watch",
    sourceSnippet: "Breakout above ₹2,980 with 3.4x volume surge.",
    confidence: 88,
    estPrice: 2984.5,
    qty: 50,
    target: 3045.0,
    stopLoss: 2950.0,
    time: "12m ago",
    status: "Pending Sign-off",
  },
  {
    id: "DEC-0890",
    ticker: "HDFCBANK",
    action: "BUY",
    sourceChannel: "Macro Derivatives Pulse",
    sourceSnippet: "Call OI unwinding at 1700 strike with institutional bid support.",
    confidence: 82,
    estPrice: 1668.2,
    qty: 75,
    target: 1710.0,
    stopLoss: 1648.0,
    time: "35m ago",
    status: "Pending Sign-off",
  },
  {
    id: "DEC-0889",
    ticker: "TCS",
    action: "SELL",
    sourceChannel: "Technical Scanners",
    sourceSnippet: "RSI bearish divergence on 5m tape at new day high.",
    confidence: 76,
    estPrice: 4185.0,
    qty: 25,
    target: 4110.0,
    stopLoss: 4220.0,
    time: "1h 18m ago",
    status: "Pending Sign-off",
  },
];

const mockMarketQuotes = [
  { symbol: "RELIANCE", price: 2984.5, change: 32.1, pct: 1.09, positive: true },
  { symbol: "HDFCBANK", price: 1668.2, change: 14.8, pct: 0.9, positive: true },
  { symbol: "TCS", price: 4185.0, change: -18.5, pct: -0.44, positive: false },
  { symbol: "INFY", price: 1832.4, change: 28.6, pct: 1.59, positive: true },
];

const mockSnapshotTimeline = [
  {
    time: "15:45 IST",
    name: "twins-eod-snapshot-20261104.json.gz",
    size: "1.48 MB",
    records: "14,200 items",
    type: "EOD Summary",
    hash: "9a2f7c4e88b201f93018e69d91a92bf01e859cf83c4801e0a294191a27e023f1",
  },
  {
    time: "13:30 IST",
    name: "twins-risk-audit-midday.json.gz",
    size: "421 KB",
    records: "3,120 items",
    type: "Risk Audit Dump",
    hash: "b41098ef01ab3817cc9123891d019f81a704981e9d0a77b819230fa10298a002",
  },
  {
    time: "10:00 IST",
    name: "twins-agent-states-morning.json.gz",
    size: "890 KB",
    records: "840 items",
    type: "Agent Opening State",
    hash: "1f3089da781c1092ef9012398ab01928374901fecb0198273645019283fa01e9",
  },
];

export default function OverviewPage() {
  const [selectedRange, setSelectedRange] = useState<"24h" | "7d" | "30d">("24h");
  const [hoveredPoint, setHoveredPoint] = useState<{
    hour: string;
    count: number;
    topChannel: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // SVG Chart path calculation
  const width = 640;
  const height = 180;
  const maxVal = 160;
  const points = hourlyData.map((d, index) => {
    const x = (index / (hourlyData.length - 1)) * (width - 40) + 20;
    const y = height - (d.count / maxVal) * (height - 30) - 15;
    return { x, y, ...d };
  });

  // Construct smooth SVG path
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="space-y-7">
      {/* 1. Refined Safety Strip */}
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-3.5 sm:px-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
            <div>
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Demo Protocol Active
              </span>
              <span className="text-xs text-ink-secondary ml-2">
                All data is simulated mock telemetry. Autonomous execution and order routing are hard-locked.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
              Engine: Disabled
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs font-semibold">
              Live Trading: Locked
            </span>
          </div>
        </div>
      </div>

      <PaperStrip />

      {/* 2. Asymmetric Summary Row with Micro-Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Intake Volume */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
              Intake Volume (24h)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-royal-50 text-royal-700 border border-royal-200/60 text-[10px] font-bold">
              8 Channels
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-ink font-sans">
              1,420
            </div>
            {/* Micro Sparkline Curve */}
            <div className="w-16 h-7">
              <svg viewBox="0 0 60 25" className="w-full h-full overflow-visible">
                <path
                  d="M 2 20 Q 15 18, 25 10 T 45 4 T 58 8"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-snug">
            +14% vs previous window • Simulated Telegram feed
          </p>
        </div>

        {/* Metric 2: Signal Conversion */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
              Signal Conversion
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
              261 Signals
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-ink font-sans">
              18.4%
            </div>
            {/* Visual Gauge */}
            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-royal-600 rounded-full w-[18.4%]" />
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-snug">
            Parsed as trade candidates by regex scanner
          </p>
        </div>

        {/* Metric 3: Pending Review Queue (Acid Highlight) */}
        <div className="rounded-2xl bg-white border-2 border-acid-400/90 p-5 shadow-card space-y-3 relative overflow-hidden bg-gradient-to-br from-white via-white to-acid-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
              Pending Decisions
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-acid-400 text-ink text-[10px] font-extrabold tracking-tight shadow-xs">
              Action Required
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-ink font-sans">
              3 Pending
            </div>
            <span className="text-xs font-mono font-bold text-acid-700 bg-acid-100 px-2 py-0.5 rounded">
              Sign-off Queue
            </span>
          </div>

          <p className="text-xs text-ink-secondary leading-snug">
            28 evaluated today • Operator review required
          </p>
        </div>

        {/* Metric 4: Snapshot Cadence */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono">
              Snapshot Freshness
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
              Coldline
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-ink font-sans">
              4h 15m
            </div>
            <span className="text-xs font-mono text-ink-muted">15:45 IST</span>
          </div>

          <p className="text-xs text-ink-secondary leading-snug truncate">
            Latest: twins-eod-20261104 (1.48 MB)
          </p>
        </div>
      </div>

      {/* 3. Hero Visual Centre: Dominant Chart Panel (8 Cols) + Saturated Blue Market Card (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Hero: Large Intake Activity Chart (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-6">
          {/* Header & Range Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-extrabold text-ink tracking-tight">
                  Telegram Ingestion Pulse
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-royal-50 text-royal-700 border border-royal-200 text-[10px] font-bold">
                  Simulated Stream
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Hourly message distribution across 8 monitored alpha channels
              </p>
            </div>

            {/* Time-Range Segmented Switcher */}
            <div className="flex items-center bg-canvas p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
              {(["24h", "7d", "30d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedRange === range
                      ? "bg-white text-royal-700 shadow-2xs font-semibold"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Large Chart SVG */}
          <div className="relative w-full pt-2">
            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-0 right-4 z-10 flex items-center gap-3 bg-ink text-white px-3.5 py-1.5 rounded-xl shadow-hero text-xs font-mono">
                <span className="text-acid-400 font-bold">{hoveredPoint.hour}</span>
                <span>•</span>
                <span className="font-bold">{hoveredPoint.count} msgs</span>
                <span className="text-slate-400 font-sans text-[11px]">({hoveredPoint.topChannel})</span>
              </div>
            )}

            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-48 sm:h-56 overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="royalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                    <stop offset="60%" stopColor="#2563EB" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Subtle Grid Guidelines */}
                <line x1="20" y1="30" x2={width - 20} y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="20" y1="80" x2={width - 20} y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="20" y1="130" x2={width - 20} y2="130" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Y-axis Labels */}
                <text x="18" y="34" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">150</text>
                <text x="18" y="84" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">100</text>
                <text x="18" y="134" fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace">50</text>

                {/* Gradient Area */}
                <path d={areaD} fill="url(#royalGradient)" />

                {/* Main Saturated Royal Curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPoint?.hour === p.hour;
                  const isPeak = p.count === 142;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Invisible hover hitbox */}
                      <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                      {/* Visible Point */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? "6" : isPeak ? "4.5" : "3"}
                        fill={isPeak ? "#84CC16" : isHovered ? "#1D4ED8" : "#FFFFFF"}
                        stroke="#2563EB"
                        strokeWidth={isHovered ? "3" : "2"}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-axis Timeline */}
            <div className="flex justify-between text-[11px] text-ink-muted font-mono px-3 pt-2 border-t border-slate-100">
              <span>00:00</span>
              <span>06:00</span>
              <span className="font-bold text-royal-700">10:00 Peak (142/hr)</span>
              <span>15:00 Close</span>
              <span>20:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Bottom Breakdown Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-royal-600" />
                <span className="text-ink-secondary">Institutional Flow</span>
                <span className="font-bold text-ink">45%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-royal-400" />
                <span className="text-ink-secondary">Macro Derivatives</span>
                <span className="font-bold text-ink">28%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-ink-secondary">Commodities</span>
                <span className="font-bold text-ink">17%</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-ink-muted">
              Contract: GET /api/v1/intake/activity
            </div>
          </div>
        </div>

        {/* Companion Panel: Distinctive Blue Market Feed Card (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 text-white p-6 sm:p-7 shadow-hero relative overflow-hidden border border-royal-700/60 flex flex-col justify-between space-y-5">
          {/* Subtle Radial Glow in background */}
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-royal-500/20 blur-3xl pointer-events-none" />

          {/* Card Top: Title & Acid-Lime Demo Badge */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-acid-400 animate-pulse" />
                <h3 className="text-base font-extrabold tracking-tight text-white">
                  Zerodha Kite Feed
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-acid-400 text-royal-950 font-extrabold text-[10px] tracking-tight shadow-xs uppercase">
                Demo Preview
              </span>
            </div>
            <p className="text-xs text-royal-200/80 leading-snug">
              Market data stream simulation. Backend gateway integration pending.
            </p>
          </div>

          {/* Key Feed Stats Grid */}
          <div className="grid grid-cols-2 gap-3 py-1 font-mono text-xs relative">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/10 space-y-0.5">
              <span className="text-[10px] uppercase text-royal-200 font-semibold">Feed Status</span>
              <div className="text-sm font-bold text-acid-300">Offline (Mock)</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/10 space-y-0.5">
              <span className="text-[10px] uppercase text-royal-200 font-semibold">Tokens</span>
              <div className="text-sm font-bold text-white">42 Active</div>
            </div>
          </div>

          {/* Sample Reference Ticks Table (Dark Tinted Rows) */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between text-[11px] font-semibold text-royal-200 px-1">
              <span>Instrument</span>
              <span>Mock Reference</span>
            </div>

            <div className="space-y-1">
              {mockMarketQuotes.map((q) => (
                <div
                  key={q.symbol}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/20 border border-white/5 text-xs font-mono hover:bg-white/10 transition-colors"
                >
                  <span className="font-bold text-white">{q.symbol}</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">
                      ₹{formatNumber(q.price)}
                    </span>
                    <span
                      className={`ml-2 text-[10px] font-bold ${
                        q.positive ? "text-acid-400" : "text-rose-300"
                      }`}
                    >
                      {q.positive ? "+" : ""}
                      {q.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Link to Market View */}
          <div className="pt-2 relative">
            <Link
              href="/market"
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white text-royal-950 font-bold text-xs hover:bg-royal-50 transition-all shadow-md group"
            >
              <span>Inspect Full Market Feed & Depth</span>
              <ArrowRight className="h-4 w-4 text-royal-700 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Recent Decisions (7 Cols) + Snapshot Timeline & Health (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Decisions Queue (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-ink tracking-tight">
                  Recent Decision Proposals
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-acid-100 text-acid-800 border border-acid-300 text-[10px] font-bold">
                  3 Pending
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Ingested Telegram signals awaiting human operator review
              </p>
            </div>

            <Link
              href="/decisions"
              className="text-xs font-bold text-royal-700 hover:text-royal-800 flex items-center gap-1"
            >
              <span>All 28 decisions</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Scannable Decision Rows */}
          <div className="divide-y divide-slate-100">
            {mockRecentDecisions.map((dec) => {
              const isBuy = dec.action === "BUY";

              return (
                <div
                  key={dec.id}
                  className="py-4 first:pt-1 last:pb-1 space-y-2.5 group hover:bg-slate-50/50 p-2.5 rounded-xl transition-colors"
                >
                  {/* Top line of decision */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                          isBuy
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {dec.action}
                      </span>
                      <span className="text-sm font-extrabold text-ink font-mono">
                        {dec.ticker}
                      </span>
                      <span className="text-xs font-mono text-ink-muted">
                        {dec.qty} units @ {formatCurrency(dec.estPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-royal-700 bg-royal-50 px-2 py-0.5 rounded-full border border-royal-200/50">
                        {dec.confidence}% Conf
                      </span>
                      <span className="text-[11px] text-ink-muted font-mono">
                        {dec.time}
                      </span>
                    </div>
                  </div>

                  {/* Signal snippet */}
                  <p className="text-xs text-ink-secondary leading-snug">
                    <span className="font-semibold text-ink">{dec.sourceChannel}: </span>
                    &ldquo;{dec.sourceSnippet}&rdquo;
                  </p>

                  {/* Economics & Disabled Action Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] font-mono text-ink-muted space-x-3">
                      <span>SL: ₹{dec.stopLoss}</span>
                      <span>Target: ₹{dec.target}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium cursor-not-allowed flex items-center gap-1"
                        title="Trading engine disabled in prototype"
                      >
                        <Lock className="h-3 w-3 text-slate-400" />
                        <span>Approve</span>
                      </button>
                      <button
                        disabled
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium cursor-not-allowed"
                        title="Trading engine disabled in prototype"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Lower Column: Snapshot Timeline & System Health (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Snapshot Freshness Visual Timeline */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-ink tracking-tight">
                  Snapshot State Archives
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Cold storage audit exports on Google Cloud Storage
                </p>
              </div>

              <Link
                href="/snapshots"
                className="text-xs font-bold text-royal-700 hover:text-royal-800 flex items-center gap-1"
              >
                <span>View</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Vertical Chronological Timeline */}
            <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {mockSnapshotTimeline.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Timeline bullet */}
                  <span className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-royal-600 ring-4 ring-white" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{item.type}</span>
                    <span className="text-[10px] font-mono text-ink-muted">{item.time}</span>
                  </div>

                  <p className="text-[11px] font-mono text-ink-secondary truncate">
                    {item.name}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-ink-muted pt-0.5">
                    <span>{item.records} • {item.size}</span>
                    <button
                      onClick={() => handleCopy(item.hash)}
                      className="text-royal-700 hover:underline flex items-center gap-1"
                    >
                      {copiedHash === item.hash ? (
                        <span className="text-emerald-700 font-bold">Copied</span>
                      ) : (
                        <span>Copy SHA-256</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact, Quiet Supporting System-Health Panel */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
                Subsystem Registry
              </h4>
              <span className="text-[10px] font-mono text-ink-muted">
                Isolated Sandbox
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-canvas border border-slate-200/60">
                <span className="text-ink-secondary font-medium">Telegram Ingestion</span>
                <span className="text-[11px] font-mono text-amber-700 font-semibold">Not Connected</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-canvas border border-slate-200/60">
                <span className="text-ink-secondary font-medium">Kite Market Feed</span>
                <span className="text-[11px] font-mono text-amber-700 font-semibold">Not Connected</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-canvas border border-slate-200/60">
                <span className="text-ink-secondary font-medium">Agent Engine</span>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">Disabled by Policy</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-canvas border border-slate-200/60">
                <span className="text-ink-secondary font-medium">Order Gateway</span>
                <span className="text-[11px] font-mono text-rose-700 font-semibold">Hard-locked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
