"use client";

import React from "react";
import Link from "next/link";
import { HardDrive, ArrowLeft, Clock } from "lucide-react";
import { SafetyStrip } from "@/components/ui/SafetyStrip";

export default function SnapshotsPage() {
  return (
    <div className="space-y-6">
      <SafetyStrip />

      <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-card text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-royal-50 text-royal-700 flex items-center justify-center mx-auto">
          <HardDrive className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cold Storage Snapshots</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Manifest of daily EOD snapshots, checksum verification jobs, and historical archive downloads.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>Stage 2 Redesign — Overview Shell Ready for Review</span>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal-700 hover:text-royal-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
