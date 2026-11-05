"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Radio,
  BarChart3,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Shield,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { twinsApi } from "@/services/api";
import { MarketTick, CandleData } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatNumber, formatTime } from "@/lib/utils";

export default function MarketDataPage() {
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE");
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(true);
  const [lastTickTimes, setLastTickTimes] = useState<Record<string, number>>({});
  const [priceFlash, setPriceFlash] = useState<Record<string, "up" | "down" | null>>({});

  // Initial load
  useEffect(() => {
    twinsApi.getMarketTicks().then((data) => {
      setTicks(data);
    });
  }, []);

  // Load candles when selected symbol changes
  useEffect(() => {
    twinsApi.getCandles(selectedSymbol).then((data) => {
      setCandles(data);
    });
  }, [selectedSymbol]);

  // Simulated live Kite tick stream (read-only)
  useEffect(() => {
    if (!streaming) return;

    const interval = setInterval(() => {
      const prevTicks = ticks;
      const updatedTicks = twinsApi.simulateTickUpdate();

      // Detect price changes for subtle green/red flash animation
      const flashUpdates: Record<string, "up" | "down" | null> = {};
      updatedTicks.forEach((newTick) => {
        const oldTick = prevTicks.find((t) => t.symbol === newTick.symbol);
        if (oldTick && oldTick.lastPrice !== newTick.lastPrice) {
          flashUpdates[newTick.symbol] =
            newTick.lastPrice > oldTick.lastPrice ? "up" : "down";
        }
      });

      if (Object.keys(flashUpdates).length > 0) {
        setPriceFlash(flashUpdates);
        setTimeout(() => setPriceFlash({}), 800);
      }

      setTicks(updatedTicks);
    }, 1500);

    return () => clearInterval(interval);
  }, [streaming, ticks]);

  const currentTick =
    ticks.find((t) => t.symbol === selectedSymbol) || ticks[0] || null;

  const filteredTicks = ticks.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-terminal-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white">
              KITE MARKET DATA FEED (READ-ONLY)
            </h1>
            <StatusBadge status="streaming" label="WS CONNECTED" pulse />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zerodha Kite WebSocket v3 stream. Read-only market ticks, Level 2 depth & intraday candle feed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreaming(!streaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              streaming
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60"
                : "bg-surface text-slate-400 border-terminal-border"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${streaming ? "animate-pulse" : ""}`} />
            <span>{streaming ? "Live Ticks: ACTIVE" : "Stream: PAUSED"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Watchlist & Ticks List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                Subscribed Instruments ({ticks.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              NSE Cash / F&O
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-terminal-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Ticks List */}
          <div className="space-y-2">
            {filteredTicks.map((tick) => {
              const isSelected = tick.symbol === selectedSymbol;
              const isPositive = tick.change >= 0;
              const flash = priceFlash[tick.symbol];

              return (
                <div
                  key={tick.instrumentToken}
                  onClick={() => setSelectedSymbol(tick.symbol)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-surface-elevated border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-surface border-terminal-border hover:border-terminal-borderLight hover:bg-surface/80"
                  } ${
                    flash === "up"
                      ? "bg-emerald-950/30"
                      : flash === "down"
                      ? "bg-rose-950/30"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {tick.symbol}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-surface-subtle px-1 rounded">
                          {tick.exchange}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {tick.companyName}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono text-sm font-bold transition-colors ${
                          flash === "up"
                            ? "text-emerald-400"
                            : flash === "down"
                            ? "text-rose-400"
                            : "text-white"
                        }`}
                      >
                        {formatCurrency(tick.lastPrice)}
                      </div>
                      <div
                        className={`flex items-center justify-end gap-1 font-mono text-[11px] ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {formatNumber(tick.change)} ({isPositive ? "+" : ""}
                          {formatNumber(tick.changePercent)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Vol: {formatNumber(tick.volume / 100000, 1)}L</span>
                    <span>H: {formatNumber(tick.high)}</span>
                    <span>L: {formatNumber(tick.low)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Quote, Depth & Candle Telemetry (7 Cols) */}
        {currentTick && (
          <div className="lg:col-span-7 space-y-4">
            {/* Header of Active Instrument */}
            <div className="rounded-xl bg-surface border border-terminal-border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-terminal-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold font-mono text-white">
                      {currentTick.symbol}
                    </h2>
                    <span className="text-xs font-mono text-slate-400 bg-surface-subtle px-2 py-0.5 rounded border border-terminal-border">
                      {currentTick.exchange}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Token #{currentTick.instrumentToken}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentTick.companyName}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-2xl font-bold font-mono text-white">
                    {formatCurrency(currentTick.lastPrice)}
                  </div>
                  <div
                    className={`flex items-center sm:justify-end gap-1 font-mono text-xs ${
                      currentTick.change >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    <span>
                      {currentTick.change >= 0 ? "+" : ""}
                      {formatNumber(currentTick.change)} ({currentTick.change >= 0 ? "+" : ""}
                      {formatNumber(currentTick.changePercent)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Day's Range Visual Bar */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Day Low: ₹{formatNumber(currentTick.low)}</span>
                  <span className="text-slate-300 font-semibold">Today&apos;s Range</span>
                  <span>Day High: ₹{formatNumber(currentTick.high)}</span>
                </div>
                <div className="relative h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-terminal-border">
                  {/* Progress bar calculating position */}
                  {currentTick.high > currentTick.low && (
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                      style={{
                        left: "0%",
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((currentTick.lastPrice - currentTick.low) /
                              (currentTick.high - currentTick.low)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                <div className="bg-surface-subtle p-2.5 rounded-lg border border-terminal-border">
                  <span className="text-[10px] text-slate-500 uppercase">Open</span>
                  <div className="text-white font-semibold">{formatCurrency(currentTick.open)}</div>
                </div>
                <div className="bg-surface-subtle p-2.5 rounded-lg border border-terminal-border">
                  <span className="text-[10px] text-slate-500 uppercase">Prev. Close</span>
                  <div className="text-white font-semibold">{formatCurrency(currentTick.prevClose)}</div>
                </div>
                <div className="bg-surface-subtle p-2.5 rounded-lg border border-terminal-border">
                  <span className="text-[10px] text-slate-500 uppercase">Volume</span>
                  <div className="text-white font-semibold">{formatNumber(currentTick.volume, 0)}</div>
                </div>
                <div className="bg-surface-subtle p-2.5 rounded-lg border border-terminal-border">
                  <span className="text-[10px] text-slate-500 uppercase">Turnover</span>
                  <div className="text-white font-semibold">₹{formatNumber(currentTick.turnoverCr)} Cr</div>
                </div>
              </div>
            </div>

            {/* Level 2 Market Depth (Order Book) */}
            <div className="rounded-xl bg-surface border border-terminal-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    Market Depth (Level 2 Order Book)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Read-only Kite Feed
                </span>
              </div>

              {currentTick.marketDepth.bids.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Bids (Buy side) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-emerald-400 pb-1 border-b border-slate-800">
                      <span>BID (BUYERS)</span>
                      <span>ORDERS</span>
                      <span>QTY</span>
                    </div>
                    {currentTick.marketDepth.bids.map((bid, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-1 px-1.5 rounded bg-emerald-950/20 text-slate-300"
                      >
                        <span className="text-emerald-400 font-semibold">
                          ₹{formatNumber(bid.price)}
                        </span>
                        <span className="text-slate-500 text-[11px]">{bid.orders}</span>
                        <span className="text-slate-200">{formatNumber(bid.quantity, 0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Asks (Sell side) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-rose-400 pb-1 border-b border-slate-800">
                      <span>ASK (SELLERS)</span>
                      <span>ORDERS</span>
                      <span>QTY</span>
                    </div>
                    {currentTick.marketDepth.asks.map((ask, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-1 px-1.5 rounded bg-rose-950/20 text-slate-300"
                      >
                        <span className="text-rose-400 font-semibold">
                          ₹{formatNumber(ask.price)}
                        </span>
                        <span className="text-slate-500 text-[11px]">{ask.orders}</span>
                        <span className="text-slate-200">{formatNumber(ask.quantity, 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs font-mono text-slate-400 bg-surface-subtle rounded-lg">
                  Index or derivative instrument: Market depth aggregated at exchange level.
                </div>
              )}
            </div>

            {/* Candle Telemetry Table / Bar Chart */}
            <div className="rounded-xl bg-surface border border-terminal-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                    Intraday 15-Minute Candles (Telemetry Log)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {candles.length} bars recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-terminal-border text-slate-500 bg-surface-subtle/50 text-[10px] uppercase">
                      <th className="py-2 px-2.5">Time</th>
                      <th className="py-2 px-2.5">Open</th>
                      <th className="py-2 px-2.5">High</th>
                      <th className="py-2 px-2.5">Low</th>
                      <th className="py-2 px-2.5">Close</th>
                      <th className="py-2 px-2.5">Volume</th>
                      <th className="py-2 px-2.5 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {candles.map((c, idx) => {
                      const isGreen = c.close >= c.open;
                      return (
                        <tr key={idx} className="hover:bg-surface-elevated/40">
                          <td className="py-2 px-2.5 text-slate-300">{c.time}</td>
                          <td className="py-2 px-2.5 text-slate-300">{formatNumber(c.open)}</td>
                          <td className="py-2 px-2.5 text-emerald-400">{formatNumber(c.high)}</td>
                          <td className="py-2 px-2.5 text-rose-400">{formatNumber(c.low)}</td>
                          <td
                            className={`py-2 px-2.5 font-bold ${
                              isGreen ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatNumber(c.close)}
                          </td>
                          <td className="py-2 px-2.5 text-slate-400">
                            {formatNumber(c.volume, 0)}
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isGreen
                                  ? "bg-emerald-950/60 text-emerald-400"
                                  : "bg-rose-950/60 text-rose-400"
                              }`}
                            >
                              {isGreen ? "+BULL" : "-BEAR"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
