"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { X } from "lucide-react";
import { BackendBanner } from "./BackendBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-slate-900 flex flex-col antialiased selection:bg-royal-100 selection:text-royal-900">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-2 top-3">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close mobile menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="fixed inset-y-0 left-0 w-64 z-20">
            <Sidebar />
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <BackendBanner />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
