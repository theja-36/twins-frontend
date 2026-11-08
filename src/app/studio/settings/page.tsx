"use client";
import { PageHead } from "@/studio/kit";
import { SettingsView } from "@/studio/settings";

export default function SettingsPage() {
  return (<><PageHead title="Settings" sub="How the system is configured right now. Everything here is read-only: settings change on the server, never from this page." /><SettingsView /></>);
}
