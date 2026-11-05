import React from "react";
import { cn } from "@/lib/utils";
import { ApprovalStatus, SystemStatusLevel, ConnectionStatus, DecisionRiskScore } from "@/types";

type BadgeStatus =
  | ApprovalStatus
  | SystemStatusLevel
  | ConnectionStatus
  | DecisionRiskScore
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label, className, pulse = false }: StatusBadgeProps) {
  const getColors = () => {
    switch (status) {
      case "healthy":
      case "connected":
      case "streaming":
      case "APPROVED":
      case "LOW":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      case "PENDING_APPROVAL":
      case "MEDIUM":
      case "running":
      case "polling":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
      case "critical":
      case "REJECTED":
      case "CRITICAL":
      case "HIGH":
        return "bg-rose-950/70 text-rose-400 border-rose-800/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]";
      case "SIMULATED":
        return "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
      case "EXPIRED":
      case "degraded":
      case "idle":
      default:
        return "bg-slate-900/80 text-slate-400 border-slate-700/60";
    }
  };

  const getDotColor = () => {
    switch (status) {
      case "healthy":
      case "connected":
      case "streaming":
      case "APPROVED":
      case "LOW":
        return "bg-emerald-400";
      case "PENDING_APPROVAL":
      case "MEDIUM":
      case "running":
      case "polling":
        return "bg-amber-400";
      case "critical":
      case "REJECTED":
      case "CRITICAL":
      case "HIGH":
        return "bg-rose-400";
      case "SIMULATED":
        return "bg-cyan-400";
      case "EXPIRED":
      case "degraded":
      case "idle":
      default:
        return "bg-slate-400";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border tracking-wide uppercase",
        getColors(),
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          getDotColor(),
          pulse && "animate-pulse"
        )}
      />
      {label || status.replace("_", " ")}
    </span>
  );
}
