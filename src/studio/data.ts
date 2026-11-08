"use client";
import React from "react";
import { useFixtureState } from "./state";

/**
 * Read layer for the Studio. Every page reads the backend through the existing GET-only proxy (/api/twins/*).
 * FIXTURES: only when the build sets NEXT_PUBLIC_STUDIO_FIXTURES=1 (local visual QA). Without it the fixtures module is never imported,
 * so production can never fall back to invented figures. A failed read is its own state; it is never turned into "empty".
 */
// NOTE: dot access is required. Next inlines only process.env.NAME; process.env["NAME"] is read at runtime in the browser, where it is empty.
export const FIXTURES_ENABLED = process.env.NEXT_PUBLIC_STUDIO_FIXTURES === "1";
export type Status = "loading" | "ok" | "absent" | "unconfigured" | "unauthorized" | "unreachable" | "invalid";
export interface Read<T> { status: Status; data: T | null; stale: boolean; lastOkAt: number | null; refresh: () => void }

/** The literal env test is what lets the bundler drop the whole fixtures chunk from builds without the flag. */
async function loadFixture(path: string, mode: "populated" | "empty"): Promise<unknown> {
  if (process.env.NEXT_PUBLIC_STUDIO_FIXTURES === "1") { const m = await import("./fixtures/api"); return m.routeFixture(path, mode); }
  return undefined;
}

async function fetchLive(path: string): Promise<{ status: Status; raw?: unknown }> {
  let res: Response;
  try { res = await fetch(`/api/twins/${path}`, { cache: "no-store" }); } catch { return { status: "unreachable" }; }
  if (res.status === 503) return { status: "unconfigured" };
  if (res.status === 401) return { status: "unauthorized" };
  if (res.status === 404) return { status: "absent" };
  if (res.status >= 500) return { status: "unreachable" };
  if (!res.ok) return { status: "invalid" };
  try { return { status: "ok", raw: await res.json() }; } catch { return { status: "invalid" }; }
}

export function useRead<T>(path: string | null, validate: (raw: unknown) => T | null, everyMs = 20_000): Read<T> {
  const fx = useFixtureState();
  const [s, setS] = React.useState<{ status: Status; data: T | null; stale: boolean; lastOkAt: number | null }>({ status: "loading", data: null, stale: false, lastOkAt: null });
  const validateRef = React.useRef(validate); validateRef.current = validate;
  const seq = React.useRef(0);
  const run = React.useCallback(async (): Promise<void> => {
    if (path === null) return;
    const mine = ++seq.current;
    let out: { status: Status; raw?: unknown };
    if (FIXTURES_ENABLED) {
      if (fx === "loading") { setS({ status: "loading", data: null, stale: false, lastOkAt: null }); return; }
      if (fx === "error") { setS({ status: "unreachable", data: null, stale: false, lastOkAt: null }); return; }
      const raw = await loadFixture(path, fx === "empty" ? "empty" : "populated");
      out = raw === undefined ? { status: "absent" } : { status: "ok", raw };
    } else out = await fetchLive(path);
    if (mine !== seq.current) return;
    if (out.status === "ok") {
      const data = validateRef.current(out.raw);
      if (data === null) setS((p) => (p.data !== null ? { ...p, stale: true } : { status: "invalid", data: null, stale: false, lastOkAt: null }));
      else setS({ status: "ok", data, stale: FIXTURES_ENABLED && fx === "stale", lastOkAt: FIXTURES_ENABLED && fx === "stale" ? Date.now() - 3.2 * 3600_000 : Date.now() });
    } else setS((p) => (p.data !== null && out.status !== "absent" ? { ...p, stale: true } : { status: out.status, data: null, stale: false, lastOkAt: null }));
  }, [path, fx]);
  React.useEffect(() => {
    void run();
    const t = FIXTURES_ENABLED ? null : setInterval(() => void run(), everyMs);
    const on = (): void => void run();
    window.addEventListener("studio-refresh", on);
    return () => { if (t) clearInterval(t); window.removeEventListener("studio-refresh", on); seq.current++; };
  }, [run, everyMs]);
  return { ...s, refresh: () => void run() };
}

export const refreshAll = (): void => { window.dispatchEvent(new Event("studio-refresh")); };
export const arr = <K extends string, T>(k: K) => (raw: unknown): T[] | null => { const v = (raw as Record<string, unknown> | null)?.[k]; return Array.isArray(v) ? (v as T[]) : null; };
export const obj = <T>(must: string) => (raw: unknown): T | null => (raw && typeof raw === "object" && must in (raw as object) ? (raw as T) : null);
