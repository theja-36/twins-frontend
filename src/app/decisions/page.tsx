"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Info,
  RefreshCw,
  FileText,
  Lock,
} from "lucide-react";
import { twinsApi } from "@/services/api";
import { DecisionItem, AgentRun, ApprovalStatus, DecisionRiskScore } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatNumber, formatDate, formatTime } from "@/lib/utils";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [activeTab, setActiveTab] = useState<"decisions" | "agent_runs">("decisions");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [modalDecision, setModalDecision] = useState<DecisionItem | null>(null);
  const [modalAction, setModalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [modalNotes, setModalNotes] = useState<string>("");

  const loadData = async () => {
    const [d, runs] = await Promise.all([
      twinsApi.getDecisions(),
      twinsApi.getAgentRuns(),
    ]);
    setDecisions(d);
    setAgentRuns(runs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenActionModal = (decision: DecisionItem, action: "APPROVE" | "REJECT") => {
    setModalDecision(decision);
    setModalAction(action);
    setModalNotes(
      action === "APPROVE"
        ? "Verified Telegram signal and Kite tick volume confirmation. Approved for audit log."
        : "Risk criteria not satisfied or signal outdated."
    );
  };

  const handleConfirmAction = async () => {
    if (!modalDecision) return;
    setActionInProgress(modalDecision.id);
    try {
      const updated = await twinsApi.updateDecisionStatus(
        modalDecision.id,
        modalAction === "APPROVE" ? "APPROVED" : "REJECTED",
        modalNotes
      );
      setDecisions((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setModalDecision(null);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : d.status === statusFilter;
    const matchesSearch =
      d.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.rationale.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = decisions.filter((d) => d.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-terminal-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-mono tracking-tight text-white">
              DECISIONS & HUMAN APPROVALS
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                {pendingCount} REQUIRE AUDIT SIGN-OFF
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Telegram ingested signals processed by AI agents. Human verification required before state commit.
          </p>
        </div>

        {/* Tab switch between Decisions and Agent Runs */}
        <div className="flex items-center bg-surface p-1 rounded-lg border border-terminal-border">
          <button
            onClick={() => setActiveTab("decisions")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === "decisions"
                ? "bg-surface-elevated text-cyan-400 border border-terminal-borderLight shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Decisions ({decisions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("agent_runs")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === "agent_runs"
                ? "bg-surface-elevated text-cyan-400 border border-terminal-borderLight shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Agent Runs ({agentRuns.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "decisions" ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-terminal-border">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search by symbol (e.g. RELIANCE), agent, or rationale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-mono text-slate-400 shrink-0">Filter:</span>
              {(["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                    statusFilter === filter
                      ? "bg-surface-elevated text-cyan-300 border border-cyan-500/40"
                      : "bg-surface-subtle text-slate-400 hover:text-slate-200 border border-terminal-border"
                  }`}
                >
                  {filter.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Decisions Cards List */}
          <div className="space-y-4">
            {filteredDecisions.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-surface border border-terminal-border">
                <Info className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-mono text-slate-300">No decisions match the filter criteria.</p>
                <p className="text-xs font-mono text-slate-500 mt-1">Try clearing your search query or selecting ALL.</p>
              </div>
            ) : (
              filteredDecisions.map((decision) => {
                const isBuy = decision.action === "BUY";
                const isSell = decision.action === "SELL";
                const isPending = decision.status === "PENDING_APPROVAL";

                return (
                  <div
                    key={decision.id}
                    className={`rounded-xl bg-surface border transition-all ${
                      isPending
                        ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-amber-500/70"
                        : "border-terminal-border hover:border-terminal-borderLight"
                    } p-5 space-y-4`}
                  >
                    {/* Top row of card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Action Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${
                            isBuy
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : isSell
                              ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {decision.action}
                        </span>

                        {/* Ticker & Exchange */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold font-mono text-white tracking-tight">
                            {decision.ticker}
                          </span>
                          <span className="text-xs font-mono text-slate-400 bg-surface-subtle px-1.5 py-0.5 rounded border border-terminal-border">
                            {decision.exchange}
                          </span>
                        </div>

                        {/* Confidence score */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
                          <span className="text-[10px] text-cyan-500 uppercase">Confidence</span>
                          <span className="font-bold">{decision.confidence}%</span>
                        </div>

                        {/* Risk Score */}
                        <StatusBadge status={decision.riskScore} label={`RISK: ${decision.riskScore}`} />
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={decision.status} />
                        <span className="text-xs font-mono text-slate-400">
                          {formatTime(decision.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Telegram Ingested Signal Source */}
                    {decision.sourceMetadata && (
                      <div className="rounded-lg bg-surface-subtle border border-purple-900/40 p-3 flex items-start gap-3">
                        <Send className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-300 font-semibold">
                              Ingested via {decision.sourceMetadata.channelName}
                            </span>
                            {decision.sourceMetadata.senderHandle && (
                              <span className="text-slate-500">
                                ({decision.sourceMetadata.senderHandle})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 italic">
                            &ldquo;{decision.sourceMetadata.messageSnippet}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Trade Economics Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-subtle/70 rounded-lg p-3 border border-terminal-border font-mono text-xs">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Est. Price</div>
                        <div className="text-sm font-semibold text-white">
                          {formatCurrency(decision.estimatedPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Proposed Qty</div>
                        <div className="text-sm font-semibold text-white">
                          {decision.proposedQty} units
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Stop Loss</div>
                        <div className="text-sm font-semibold text-rose-400">
                          {decision.proposedStopLoss ? formatCurrency(decision.proposedStopLoss) : "None"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Target</div>
                        <div className="text-sm font-semibold text-emerald-400">
                          {decision.proposedTarget ? formatCurrency(decision.proposedTarget) : "Discretionary"}
                        </div>
                      </div>
                    </div>

                    {/* Agent Rationale */}
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-slate-300 font-semibold">{decision.agentName}</span>
                        <span className="text-slate-500">• Reasoning</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-surface-subtle/40 p-2.5 rounded border border-slate-800">
                        {decision.rationale}
                      </p>
                    </div>

                    {/* Risk Factors */}
                    {decision.riskFactors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-slate-500 text-[10px] uppercase">Risk Flags:</span>
                        {decision.riskFactors.map((flag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-950/40 text-rose-300 border border-rose-900/60"
                          >
                            <AlertTriangle className="h-3 w-3 text-rose-400" />
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Approver notes if already processed */}
                    {decision.approverNotes && (
                      <div className="text-xs font-mono bg-surface-subtle/80 p-2 rounded border border-terminal-border text-slate-400 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>Audit Log: {decision.approverNotes}</span>
                      </div>
                    )}

                    {/* Footer Row: Cryptographic Hash & Actions */}
                    <div className="pt-3 border-t border-terminal-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] uppercase">Audit Hash:</span>
                        <code className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {decision.auditHash}
                        </code>
                      </div>

                      {/* Approval Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(decision, "REJECT")}
                              disabled={actionInProgress === decision.id}
                              className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/80 font-mono text-xs transition-colors flex items-center gap-1.5"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(decision, "APPROVE")}
                              disabled={actionInProgress === decision.id}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold shadow-md shadow-emerald-950/50 transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve (Simulated Sign-off)</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-slate-500 text-xs flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Action committed to local audit trail</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Agent Runs View */
        <div className="rounded-xl bg-surface border border-terminal-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white">
                Autonomous Intelligence Execution Trace
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {agentRuns.length} runs recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-terminal-border text-slate-400 bg-surface-subtle/50">
                  <th className="py-2.5 px-3">RUN ID / AGENT</th>
                  <th className="py-2.5 px-3">TRIGGER</th>
                  <th className="py-2.5 px-3">STARTED</th>
                  <th className="py-2.5 px-3">LATENCY</th>
                  <th className="py-2.5 px-3">METRICS</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">REASONING TRACE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{run.agentName}</div>
                      <div className="text-[10px] text-slate-500">{run.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-surface-subtle border border-terminal-border text-cyan-300">
                        {run.trigger.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(run.startedAt).toLocaleTimeString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-emerald-400">
                      {run.durationMs} ms
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{run.tokensScanned} tokens</div>
                      <div className="text-[10px] text-slate-500">
                        {run.decisionsEmitted} decision{run.decisionsEmitted === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        status={run.status === "SUCCESS" ? "APPROVED" : "REJECTED"}
                        label={run.status}
                      />
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs">
                      <p className="truncate text-slate-400" title={run.reasoningSnippet}>
                        {run.reasoningSnippet}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Simulated Approval/Rejection */}
      {modalDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-terminal-borderLight p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-terminal-border">
              <div className="flex items-center gap-2">
                {modalAction === "APPROVE" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                )}
                <h3 className="font-mono text-base font-bold text-white uppercase">
                  {modalAction === "APPROVE" ? "Approve Decision" : "Reject Decision"}
                </h3>
              </div>
              <button
                onClick={() => setModalDecision(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-surface-subtle p-3 rounded-lg border border-terminal-border space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Decision ID</span>
                  <span className="text-white">{modalDecision.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Instrument</span>
                  <span className="text-cyan-400 font-bold">{modalDecision.ticker} ({modalDecision.action})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantity & Est. Price</span>
                  <span className="text-white">{modalDecision.proposedQty} @ {formatCurrency(modalDecision.estimatedPrice)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Human Approver Audit Notes:
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-subtle border border-terminal-border rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                <span className="font-bold">Notice:</span> Read-only mode active. This commits a cryptographic sign-off entry to the audit log. Live broker order placement remains disabled.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setModalDecision(null)}
                className="px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-slate-300 font-mono text-xs border border-terminal-border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold text-white transition-colors ${
                  modalAction === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50"
                    : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50"
                }`}
              >
                {modalAction === "APPROVE" ? "Confirm Simulated Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
