import { Badge } from "./primitives";
import type { Reliability } from "@/api/contracts/types";
const T: Record<Reliability, { tone: "ok" | "warn" | "bad" | "mute" | "info"; text: string; title: string }> = {
  INSUFFICIENT_DATA: { tone: "warn", text: "INSUFFICIENT DATA", title: "Too few outcomes for any conclusion." },
  NOT_VALIDATED_FIXTURE: { tone: "warn", text: "NOT VALIDATED · FIXTURE", title: "Built from fixture data. Not validated performance." },
  LOW: { tone: "warn", text: "LOW", title: "Small sample: treat as a hint." },
  MODERATE: { tone: "info", text: "MODERATE", title: "Moderate sample." },
  ADEQUATE: { tone: "ok", text: "ADEQUATE", title: "Adequate sample (still not a prediction)." },
  NOT_CALIBRATED: { tone: "warn", text: "NOT CALIBRATED", title: "Not calibrated: not a probability." },
  UNAVAILABLE: { tone: "mute", text: "UNAVAILABLE", title: "Not available." },
};
export const ReliabilityBadge = ({ r }: { r: Reliability | string }) => { const t = T[r as Reliability] ?? { tone: "mute" as const, text: String(r), title: "" }; return <Badge tone={t.tone} title={t.title}>{t.text}</Badge>; };
