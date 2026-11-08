"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TONE_DOT, type Tone } from "./tone";

/** Route change: a short fade only, never delaying the content. Honours prefers-reduced-motion. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.14, ease: "easeOut" }}>{children}</motion.div>;
}
/** Small status dot; `live` adds a slow pulse (still, under reduced motion). */
export function StatusDot({ tone, live = false, label }: { tone: Tone; live?: boolean; label?: string }) {
  const reduce = useReducedMotion();
  return (
    <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="relative inline-flex h-2 w-2 shrink-0">
      {live && !reduce ? <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-50", TONE_DOT[tone])} /> : null}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", TONE_DOT[tone])} />
    </span>
  );
}
