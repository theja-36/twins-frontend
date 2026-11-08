/** Semantic tones. Colour is never the only carrier of meaning: every use pairs a tone with a text label (and usually an icon or shape). */
export type Tone = "ok" | "warn" | "bad" | "info" | "mute" | "accent";
export const TONE_TEXT: Record<Tone, string> = { ok: "text-pos", warn: "text-warn", bad: "text-neg", info: "text-info", mute: "text-fg-muted", accent: "text-accent" };
export const TONE_BG: Record<Tone, string> = { ok: "bg-pos/10 border-pos/30", warn: "bg-warn/10 border-warn/30", bad: "bg-neg/10 border-neg/30", info: "bg-info/10 border-info/30", mute: "bg-surface-3 border-line", accent: "bg-accent/10 border-accent/30" };
export const TONE_DOT: Record<Tone, string> = { ok: "bg-pos", warn: "bg-warn", bad: "bg-neg", info: "bg-info", mute: "bg-fg-faint", accent: "bg-accent" };
export const TONE_SYMBOL: Record<Tone, string> = { ok: "●", warn: "▲", bad: "■", info: "◆", mute: "○", accent: "◆" };
