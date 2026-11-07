"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** Right-hand drawer. Escape and the backdrop close it; focus moves into it on open and returns on close; the page behind is inert to pointer input. */
export function Drawer({ open, onClose, title, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
  const reduce = useReducedMotion();
  const panel = React.useRef<HTMLDivElement>(null);
  const opener = React.useRef<Element | null>(null);
  React.useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); (opener.current as HTMLElement | null)?.focus?.(); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
            className={`relative flex h-full w-full ${width} flex-col overflow-y-auto border-l border-slate-200/80 bg-white p-6 shadow-xl outline-none`}
            initial={reduce ? false : { x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { x: 48, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-ink">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"><X className="h-5 w-5" /></button></div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Centered confirmation dialog (no browser dialogs). */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl outline-none">
            <h2 className="text-lg font-semibold text-ink">{title}</h2><div className="mt-3 text-sm text-slate-600">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
