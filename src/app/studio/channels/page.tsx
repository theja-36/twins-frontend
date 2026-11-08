"use client";
import { ChannelsView } from "@/studio/channels";
import { PageHead } from "@/studio/kit";

export default function ChannelsPage() {
  return (<><PageHead title="Channels" sub="Which Telegram channels TWINS has captured, and what was parsed from them. Counts and parsed fields only; message text is never shown." /><ChannelsView /></>);
}
