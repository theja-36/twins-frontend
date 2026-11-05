import React from "react";
import { cn } from "@/lib/utils";

export type PillVariant =
  | "neutral"
  | "warning"
  | "success"
  | "danger"
  | "royal"
  | "lime";

interface StatusPillProps {
  label: string;
  variant?: PillVariant;
  dot?: boolean;
  className?: string;
}

export function StatusPill({
  label,
  variant = "neutral",
  dot = true,
  className,
}: StatusPillProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "success":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      case "danger":
        return "bg-rose-50 text-rose-800 border-rose-200/80";
      case "royal":
        return "bg-royal-50 text-royal-800 border-royal-200/80";
      case "lime":
        return "bg-lime-100 text-lime-900 border-lime-300";
      case "neutral":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case "warning":
        return "bg-amber-500";
      case "success":
        return "bg-emerald-500";
      case "danger":
        return "bg-rose-500";
      case "royal":
        return "bg-royal-600";
      case "lime":
        return "bg-lime-600";
      case "neutral":
      default:
        return "bg-slate-400";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none",
        getVariantStyles(),
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getDotColor())} />}
      <span>{label}</span>
    </span>
  );
}
