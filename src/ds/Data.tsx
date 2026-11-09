"use client";
import React from "react";
import { useEndpoint, type EndpointDef, type QueryResult } from "@/api/query";
import { Banner, EmptyState, ErrorState, PermissionDenied, SkeletonBlock, StaleBanner, UnavailableState } from "./states";

/**
 * Renders the eight data states for one endpoint so no screen can forget one:
 * loading -> skeleton, error -> retryable error, denied -> permission-denied, unavailable -> names the missing backend piece,
 * empty -> empty state, stale -> content + stale banner, ready/partial -> content. DEMO data always carries the DEMO banner.
 */
export function Data<T>({ def, what, children, empty, rows = 5 }: { def: EndpointDef<T>; what: string; children: (data: T, q: QueryResult<T>) => React.ReactNode; empty?: React.ReactNode; rows?: number }) {
  const q = useEndpoint(def);
  return <DataView q={q} what={what} empty={empty} rows={rows}>{children}</DataView>;
}
export function DataView<T>({ q, what, children, empty, rows = 5 }: { q: QueryResult<T>; what: string; children: (data: T, q: QueryResult<T>) => React.ReactNode; empty?: React.ReactNode; rows?: number }) {
  const { state, data, def } = q;
  if (state === "loading") return <SkeletonBlock rows={rows} label={`Loading ${what}`} />;
  if (state === "denied") return <PermissionDenied title={`${what}: sign-in required`}>{what} is owner-scoped and needs an authenticated user session and the <code className="num">{def.permission ?? "required"}</code> permission. User sessions are not built yet (Stage 01 gap), and the app does not treat its shared server token as a user identity, so nothing is shown rather than another user&rsquo;s data.</PermissionDenied>;
  if (state === "unavailable") return <UnavailableState what={what} dependency={def.dependency ?? "a backend route"}>The typed contract exists; the web route does not. Nothing is invented in its place.</UnavailableState>;
  if (state === "error") return <ErrorState title={`Could not load ${what}`} onRetry={q.error?.retryable ? q.refetch : undefined}>{q.error?.message}</ErrorState>;
  if (state === "empty") return <>{empty ?? <EmptyState title={`No ${what} yet`}>Nothing has been recorded.</EmptyState>}</>;
  return <div className="space-y-4">{state === "partial" && data !== null && def.partialReason?.(data) ? <Banner tone="info" title="Partly available">{def.partialReason(data)}</Banner> : null}{state === "stale" && <StaleBanner since={q.fetchedAt ? new Date(q.fetchedAt).toISOString() : null} />}{data !== null && children(data, q)}</div>;
}
