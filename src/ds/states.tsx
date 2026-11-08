"use client";
import React from "react";
import { AlertTriangle, Ban, DatabaseZap, Inbox, Lock, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Card } from "./primitives";

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn("skeleton h-4 w-full", className)} />;
export function SkeletonBlock({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return <div role="status" aria-busy="true" aria-label={label} className="space-y-2.5 p-4">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={i === 0 ? "h-5 w-1/3" : i % 2 ? "w-full" : "w-4/5"} />)}<span className="sr-only">{label}…</span></div>;
}
function Shell({ icon, title, children, tone = "mute", actions }: { icon: React.ReactNode; title: string; children?: React.ReactNode; tone?: "mute" | "warn" | "bad"; actions?: React.ReactNode }) {
  return (
    <div role={tone === "bad" ? "alert" : "status"} className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className={cn("grid h-10 w-10 place-items-center rounded-full border", tone === "bad" ? "border-neg/30 text-neg" : tone === "warn" ? "border-warn/30 text-warn" : "border-line text-fg-muted")} aria-hidden>{icon}</div>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {children ? <div className="max-w-md text-sm text-fg-muted">{children}</div> : null}
      {actions ? <div className="mt-1 flex gap-2">{actions}</div> : null}
    </div>
  );
}
export const EmptyState = ({ title = "Nothing here yet", children, actions }: { title?: string; children?: React.ReactNode; actions?: React.ReactNode }) => <Shell icon={<Inbox className="h-5 w-5" />} title={title} actions={actions}>{children}</Shell>;
export const ErrorState = ({ title = "Could not load this", children, onRetry }: { title?: string; children?: React.ReactNode; onRetry?: () => void }) => <Shell tone="bad" icon={<WifiOff className="h-5 w-5" />} title={title} actions={onRetry ? <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-sm hover:bg-surface-3"><RefreshCw className="h-3.5 w-3.5" />Retry</button> : null}>{children}</Shell>;
export const PermissionDenied = ({ title = "Access denied", children }: { title?: string; children?: React.ReactNode }) => <Shell tone="warn" icon={<Lock className="h-5 w-5" />} title={title}>{children ?? "You do not have permission to view this. The backend decides access; hiding a menu entry is not security."}</Shell>;
/** Used for data that no backend route provides yet: says so, names the dependency, never shows a number. */
export const UnavailableState = ({ what, dependency, children }: { what: string; dependency: string; children?: React.ReactNode }) => (
  <Shell icon={<DatabaseZap className="h-5 w-5" />} title={`${what} is not available yet`}>
    <p>The interface for this is built against a typed contract, but the backend does not expose it to the web app yet.</p>
    <p className="mt-1.5 text-xs text-fg-faint">Dependency: {dependency}</p>{children}
  </Shell>
);
export const DisabledByDesign = ({ title, children }: { title: string; children: React.ReactNode }) => <Shell icon={<Ban className="h-5 w-5" />} title={title}>{children}</Shell>;
export function Banner({ tone, title, children, live = false }: { tone: "warn" | "bad" | "info"; title: string; children?: React.ReactNode; live?: boolean }) {
  return <div role={live ? "alert" : "note"} className={cn("flex gap-2 rounded-lg border px-3 py-2 text-sm", tone === "bad" ? "border-neg/30 bg-neg/10 text-neg" : tone === "warn" ? "border-warn/30 bg-warn/10 text-warn" : "border-info/30 bg-info/10 text-info")}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><div className="min-w-0"><b>{title}</b>{children ? <div className="text-xs opacity-90">{children}</div> : null}</div></div>;
}
export const DemoBanner = () => <Banner tone="warn" title="DEMO / FIXTURE data">Every figure on this page is an invented development fixture, not real trading information. It is only shown because the build enables demo mode.</Banner>;
export function StaleBanner({ since }: { since: string | null }) { return <Banner tone="warn" live title="Showing older data">The latest refresh failed; these figures are from {since ?? "an earlier read"} and may be out of date. They are not being updated.</Banner>; }
export const PartialBanner = ({ missing }: { missing: string }) => <Banner tone="info" title="Partial data">{missing}</Banner>;
export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) { return <Card className={className}><div className="border-b border-line px-4 py-2.5 text-sm font-semibold">{title}</div>{children}</Card>; }
export const InlineProv = ({ children }: { children: React.ReactNode }) => <Badge tone="mute">{children}</Badge>;
