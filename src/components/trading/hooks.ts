"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RETRY_EVENT } from "@/services/backendState";
import type { Loaded } from "@/types/trading";

/**
 * Loads a value now and every `everyMs` (default 15 s). If a later refresh fails the LAST GOOD value is kept (the global banner says the backend has a problem and the value may be stale);
 * before the first success `loaded` stays null. Never throws into the page. Listens for the banner's Retry button.
 */
export function useLoaded<T>(fn: () => Promise<Loaded<T>>, everyMs = 15_000): { loaded: Loaded<T> | null; loading: boolean; refresh: () => void } {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(fn); ref.current = fn;
  const run = useCallback(async () => { setLoading(true); try { setLoaded(await ref.current()); } catch { /* the shared backend state reports it; keep the last good value */ } finally { setLoading(false); } }, []);
  useEffect(() => {
    void run();
    const t = everyMs ? setInterval(() => void run(), everyMs) : undefined;
    const retry = () => void run();
    window.addEventListener(RETRY_EVENT, retry);
    return () => { if (t) clearInterval(t); window.removeEventListener(RETRY_EVENT, retry); };
  }, [run, everyMs]);
  return { loaded, loading, refresh: () => void run() };
}
