import React from "react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtext,
  icon,
  badge,
  highlight = false,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border p-4 sm:p-5 shadow-card transition-all duration-150 hover:shadow-cardHover",
        highlight
          ? "border-royal-200 ring-1 ring-royal-100"
          : "border-slate-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal-50 text-royal-700">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {badge}
      </div>

      <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">
        {subtext}
      </p>
    </div>
  );
}
