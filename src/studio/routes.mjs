/** Planned production-route transition. Redirects are OFF unless the build sets TWINS_UI=studio, so every classic URL keeps working today. Deep links with ids (/decision/<id>) are never redirected. */
export const CLASSIC_TO_STUDIO = [
  ["/", "/studio"], ["/decisions", "/studio/deck"], ["/approvals", "/studio/deck"], ["/signals", "/studio/signals"], ["/claims", "/studio/signals"],
  ["/channels", "/studio/channels"], ["/market", "/studio/market"], ["/positions", "/studio/portfolio"], ["/pnl", "/studio/portfolio"], ["/settings", "/studio/settings"],
];
export const studioRedirects = (enabled) => (enabled ? CLASSIC_TO_STUDIO.map(([source, destination]) => ({ source, destination, permanent: false })) : []);
