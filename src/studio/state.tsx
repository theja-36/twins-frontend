"use client";
import React from "react";

/** Fixture states for local visual QA (only offered when the build enables fixtures). */
export type FixtureState = "populated" | "empty" | "loading" | "error" | "stale";
export const STATES: Array<[FixtureState, string]> = [["populated", "Populated"], ["empty", "Empty"], ["loading", "Loading"], ["error", "Error"], ["stale", "Stale"]];
const Ctx = React.createContext<FixtureState>("populated");
export const useFixtureState = (): FixtureState => React.useContext(Ctx);
export function FixtureStateProvider({ value, children }: { value: FixtureState; children: React.ReactNode }) { return <Ctx.Provider value={value}>{children}</Ctx.Provider>; }
