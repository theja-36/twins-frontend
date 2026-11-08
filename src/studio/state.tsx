"use client";
import React from "react";
import { AlertTriangle, Inbox } from "lucide-react";

/** Fixture states, so every screen can be inspected populated, empty, loading, failing or stale. Prototype only. */
export type FixtureState = "populated" | "empty" | "loading" | "error" | "stale";
export const STATES: Array<[FixtureState, string]> = [["populated", "Populated"], ["empty", "Empty"], ["loading", "Loading"], ["error", "Error"], ["stale", "Stale"]];
const Ctx = React.createContext<FixtureState>("populated");
export const useFixtureState = (): FixtureState => React.useContext(Ctx);
export function FixtureStateProvider({ value, children }: { value: FixtureState; children: React.ReactNode }) { return <Ctx.Provider value={value}>{children}</Ctx.Provider>; }

export function Skeleton({ h = 120 }: { h?: number }) { return <div className="st-skel" style={{ height: h }} role="status" aria-label="Loading" />; }

/** Renders children only for populated and stale data; the other states get their own honest message. */
export function StateGate({ children, what, skeleton }: { children: React.ReactNode; what: string; skeleton?: React.ReactNode }) {
  const st = useFixtureState();
  if (st === "loading") return <>{skeleton ?? <div className="st-grid"><Skeleton /><Skeleton /></div>}</>;
  if (st === "error") return <div className="st-gap" role="alert"><strong><AlertTriangle size={15} aria-hidden style={{ verticalAlign: -2 }} /> Could not load {what}.</strong>The backend did not answer. Nothing is shown rather than old numbers. This is an error, not an empty result.<div style={{ marginTop: 10 }}><button className="st-btn ghost">Try again</button></div></div>;
  if (st === "empty") return <div className="st-card" style={{ textAlign: "center", padding: 36 }}><Inbox size={30} aria-hidden style={{ color: "var(--ink3)" }} /><h2 style={{ marginTop: 8 }}>No {what} yet</h2><p className="st-sub" style={{ margin: 0 }}>The backend answered and there is nothing to show. That is different from an error.</p></div>;
  return <>{st === "stale" ? <div className="st-gap" role="status" style={{ marginBottom: 16 }}><strong>This data is stale.</strong>The last update for {what} was 3 h 12 min ago. The numbers below may no longer be true.</div> : null}{children}</>;
}
