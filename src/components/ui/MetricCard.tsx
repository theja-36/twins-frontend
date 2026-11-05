import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  badge?: React.ReactNode;
  glow?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "none";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  trend,
  trendValue,
  badge,
  glow = "none",
  className,
}: MetricCardProps) {
  const getGlowClass = () => {
    switch (glow) {
      case "cyan":
        return "glow-cyan border-cyan-500/30";
      case "emerald":
        return "glow-emerald border-emerald-500/30";
      case "amber":
        return "glow-amber border-amber-500/30";
      case "rose":
        return "glow-rose border-rose-500/30";
      case "purple":
        return "glow-purple border-purple-500/30";
      default:
        return "border-slate-800/80 hover:border-slate-700/80";
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface/90 backdrop-blur-md p-4 transition-all duration-200 border",
        getGlowClass(),
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
          {title}
        </p>
        {icon && <div className="text-slate-400 p-1 rounded-lg bg-surface-subtle">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-semibold tracking-tight text-white font-mono">
          {value}
        </h3>
        {badge}
      </div>

      {(subtext || trendValue) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trendValue && (
            <span
              className={cn(
                "font-mono font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-rose-400",
                trend === "neutral" && "text-slate-400"
              )}
            >
              {trend === "up" ? "▲ " : trend === "down" ? "▼ " : "● "}
              {trendValue}
            </span>
          )}
          {subtext && <span className="text-slate-400 truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
