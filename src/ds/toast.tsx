"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { TONE_BG, TONE_TEXT, type Tone } from "./tone";

interface T { id: number; text: string; tone: Tone }
const Ctx = React.createContext<{ toast: (text: string, tone?: Tone) => void }>({ toast: () => undefined });
export const useToast = (): { toast: (text: string, tone?: Tone) => void } => React.useContext(Ctx);
/** Toasts are announced to screen readers (role=status) and disappear by themselves; nothing important is only ever shown in a toast. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<T[]>([]);
  const toast = React.useCallback((text: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random(); setItems((p) => [...p.slice(-3), { id, text, tone }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => <div key={t.id} className={cn("pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur", TONE_BG[t.tone], "bg-surface")}><span className={TONE_TEXT[t.tone]}>{t.text}</span></div>)}
      </div>
    </Ctx.Provider>
  );
}
