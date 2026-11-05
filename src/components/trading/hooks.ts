"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Loaded } from "@/types/trading";

/** Loads a value now and every `everyMs` (default 15 s). Keeps the last good value while refreshing; never throws into the page. */
export function useLoaded<T>(fn: () => Promise<Loaded<T>>, everyMs = 15_000): { loaded: Loaded<T> | null; loading: boolean; refresh: () => void } {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(fn); ref.current = fn;
  const run = useCallback(async () => { setLoading(true); try { setLoaded(await ref.current()); } finally { setLoading(false); } }, []);
  useEffect(() => { void run(); if (!everyMs) return; const t = setInterval(() => void run(), everyMs); return () => clearInterval(t); }, [run, everyMs]);
  return { loaded, loading, refresh: () => void run() };
}
