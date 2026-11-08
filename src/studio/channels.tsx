"use client";
import React from "react";
import { Plus } from "lucide-react";
import type { TelegramChannel, TelegramClaim } from "@/types/trading";
import { loadSelection, saveSelection } from "@/lib/channels";
import { arr, useRead } from "./data";
import { AddChannel, ClaimSheet, claimCols } from "./claims";
import { Card, Chip, ReadGate, Table } from "./kit";
import { ageText, isCompleteClaim } from "./model";

/** Channels: checkboxes only choose what the feed shows (a per-browser view filter). Capture is a host setting; this page cannot change it. */
export function ChannelsView() {
  const ch = useRead<TelegramChannel[]>("telegram/channels", arr<"channels", TelegramChannel>("channels"));
  const cl = useRead<TelegramClaim[]>("telegram/claims?limit=100", arr<"claims", TelegramClaim>("claims"));
  const [sel, setSel] = React.useState<Set<string> | null>(null);
  const [complete, setComplete] = React.useState(false);
  const [open, setOpen] = React.useState<TelegramClaim | null>(null);
  const [adding, setAdding] = React.useState(false);
  React.useEffect(() => setSel(loadSelection()), []);
  const toggle = (c: string, all: string[]): void => setSel((p) => { const n = new Set(p ?? all); if (n.has(c)) n.delete(c); else n.add(c); const out = n.size === all.length ? null : n; saveSelection(out); return out; });
  return (
    <>
      <div className="st-filters"><span className="st-chip mute">Channel management is read-only</span><span style={{ flex: 1 }} /><button className="st-btn ghost" onClick={() => setAdding(true)}><Plus size={16} aria-hidden />Add Telegram channel</button></div>
      <ReadGate read={ch} what="channels" isEmpty={(d) => d.length === 0} emptyHint="Channels appear after the capture has stored a message from an approved chat." unavailableHint="The channel list needs the newer backend (Phase 2 routes).">
        {(chans) => {
          const names = chans.map((c) => c.channel);
          const shown = (c: string): boolean => sel === null || sel.has(c);
          const feed = (cl.data ?? []).filter((r) => shown(r.channel) && (!complete || isCompleteClaim(r)));
          return (
            <>
              <div className="st-grid st-three" role="group" aria-label="Channels">
                {chans.map((c) => {
                  const total = c.claims.claim + c.claims.ambiguous + c.claims.unsupported;
                  const lastRecent = c.lastMessageAgeSeconds !== null && c.lastMessageAgeSeconds < 7200;
                  return (
                    <div key={c.id} className="st-chan" data-on={shown(c.channel)}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                        <div><h2 style={{ margin: 0, fontSize: 18 }}>{c.channel}</h2><p className="st-sub" style={{ margin: "2px 0 0" }}>{c.name ?? "no display name"}</p></div>
                        <label className="st-check"><input type="checkbox" checked={shown(c.channel)} onChange={() => toggle(c.channel, names)} aria-label={`Show ${c.channel} in the feed`} />Show in feed</label>
                      </div>
                      <div className="st-funnel" aria-label="Messages to claims">
                        <div><strong className="num">{c.messages}</strong>messages{c.revisions ? <><br />+{c.revisions} edits</> : null}</div>
                        <div><strong className="num">{total}</strong>parsed claims<br />{c.claims.claim} claim · {c.claims.ambiguous} ambiguous · {c.claims.unsupported} unsupported</div>
                        <div><strong>n/a</strong>decisions<br />the API does not attribute decisions to a channel</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Chip tone={lastRecent ? "ok" : "mute"} title="Based only on the age of the newest stored message">{c.lastMessageAgeSeconds === null ? "no messages" : `last message ${ageText(c.lastMessageAgeSeconds).replace(" old", " ago")}`}</Chip>
                        <Chip tone={c.captureAllowed === true ? "ok" : c.captureAllowed === false ? "bad" : "mute"}>{c.captureAllowed === true ? "Capture allowed" : c.captureAllowed === false ? "Capture not allowed" : "Capture policy unknown"}</Chip>
                        <Chip tone="mute" title="Trust tiers need scorecards from evaluated outcomes, which do not exist yet">Trust: UNKNOWN</Chip>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Card title="Signal feed" sub={`Parsed claims from ${sel === null ? "all channels" : `${sel.size} selected channel${sel.size === 1 ? "" : "s"}`}. Checkboxes only change this view.`}
                right={<div className="st-stack" style={{ gap: 8 }}>
                  <label className="st-check" title="Result reports are dropped at intake since parser v3, so none are stored to show."><input type="checkbox" disabled />Show result reports</label>
                  <label className="st-check"><input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)} />Complete claims only</label></div>}>
                <p className="st-sub">Result reports are dropped at intake (parser v3), so there are none to show. &quot;Complete claims only&quot; hides claims without a stated action and entry, such as some older parses.</p>
                <ReadGate read={cl} what="parsed claims" isEmpty={(d) => d.length === 0} emptyHint="No claim has been parsed yet." unavailableHint="The claims feed needs the newer backend.">
                  {() => feed.length === 0 ? <div className="st-empty"><h3>No claims in this view</h3><p>Select a channel above or loosen the filter. This is a filter result, not an error.</p></div> : <Table caption="Signal feed" rows={feed} rowKey={(r) => r.id} onRow={setOpen} cols={claimCols(setOpen)} selected={open?.id ?? null} />}
                </ReadGate>
              </Card>
            </>
          );
        }}
      </ReadGate>
      <ClaimSheet c={open} onClose={() => setOpen(null)} />
      <AddChannel open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
