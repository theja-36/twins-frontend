"use client";
import { Deck } from "@/studio/Deck";

export default function DeckPage() {
  return (
    <>
      <header className="st-top"><div><h1>Decision Deck</h1><p>Go through signals one at a time. Read-only: swiping only moves between cards.</p></div></header>
      <Deck />
    </>
  );
}
