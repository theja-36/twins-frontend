"use client";
import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Light / dark switch. Saves the choice in localStorage (wrapped: private windows can block it) and sets the `dark` class on <html>. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("twins-theme", next ? "dark" : "light"); } catch { /* the choice just will not persist */ }
  };
  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-ink-secondary shadow-2xs transition-all hover:border-slate-300 hover:text-ink">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
