// A TEST-ONLY stand-in for the TWINS backend's account and intelligence routes, to exercise the web app's login relay. It is NOT the real backend and proves nothing about it
// (the real session rules are proven by the backend's own PostgreSQL integration tests). It listens on 127.0.0.1 only, and holds two fixed synthetic users.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const USERS = { "alice@example.test": { pw: "alice-pass-1234", id: "u-alice", name: "alice" }, "bob@example.test": { pw: "bob-pass-12345", id: "u-bob", name: "bob" } };
const sessions = new Map(); // token -> { email, exp, dead }
const log = []; const failures = new Map();
const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
const readBody = (req) => new Promise((ok) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); });
const bearer = (req) => { const h = req.headers.authorization ?? ""; return h.startsWith("Bearer ") ? h.slice(7) : null; };
const live = (t) => { const s = t ? sessions.get(t) : null; return s && !s.dead && s.exp > Date.now() ? s : null; };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"), p = url.pathname;
  if (p.startsWith("/__")) { // control surface for the tests
    if (p === "/__log") return send(res, 200, log);
    if (p === "/__reset") { log.length = 0; failures.clear(); return send(res, 204); }
    if (p === "/__kill") { for (const s of sessions.values()) if (s.email === url.searchParams.get("email")) { if (url.searchParams.get("how") === "expire") s.exp = Date.now() - 1; else s.dead = true; } return send(res, 204); }
    return send(res, 404, { error: "x" });
  }
  const tok = bearer(req); log.push({ method: req.method, path: p, auth: tok === null ? null : tok.startsWith("tws_") ? "session" : tok });
  if (req.method === "POST" && p === "/auth/login") {
    let b; try { b = JSON.parse(await readBody(req)); } catch { return send(res, 422, { error: "VALIDATION" }); }
    const u = USERS[b?.email], n = failures.get(b?.email) ?? 0;
    if (n >= 5) return send(res, 429, { error: "RATE_LIMITED" });
    if (!u || u.pw !== b.password) { failures.set(b?.email, n + 1); return send(res, 401, { error: "UNAUTHENTICATED", message: "invalid credentials" }); }
    const token = "tws_" + randomBytes(30).toString("base64url"), exp = Date.now() + 2 * 3600_000;
    sessions.set(token, { email: b.email, exp, dead: false });
    return send(res, 200, { token, expiresAt: new Date(exp).toISOString(), user: { id: u.id, email: b.email, displayName: u.name, roles: ["TRADER"] } });
  }
  if (req.method === "POST" && p === "/auth/logout") { const s = sessions.get(tok); if (s) s.dead = true; return send(res, 204); }
  const s = live(tok);
  if (p === "/auth/me") return s ? send(res, 200, { user: { id: USERS[s.email].id, email: s.email, displayName: USERS[s.email].name, roles: ["TRADER"] } }) : send(res, 401, { error: "UNAUTHENTICATED" });
  if (p.startsWith("/intelligence/")) {
    if (!s) return send(res, 401, { error: "UNAUTHENTICATED" });
    const who = USERS[s.email].name;
    if (p === "/intelligence/playbooks") return send(res, 200, { state: "EMPTY", playbooks: [] });
    if (p === "/intelligence/channels") return send(res, 200, { channels: [{ id: "00000000-0000-4000-8000-000000000031", channel: `***${who}`, name: null, messages: 5, messages24h: 1, claims: { claim: 5, ambiguous: 0, unsupported: 0 }, candidates: {}, firstMessageAt: null, lastMessageAt: null, health: { status: "ACTIVE", lastMessageAgeSeconds: 60, messages24h: 1, capture: "TIMELY", reasons: [], reliability: "NOT_AVAILABLE" } }], reliabilityNote: "x" });
    if (p.endsWith("/performance")) return send(res, 200, { channel: { id: "x", channel: `***${who}`, name: null }, funnel: { claims: { claim: 5, ambiguous: 0, unsupported: 0 }, candidacy: {}, candidates: {}, firstClaimAt: null, lastClaimAt: null }, outcomes: { status: "NOT_AVAILABLE", reason: "r" }, reliability: "NOT_AVAILABLE", archive: { linked: false, note: "n" } });
    return send(res, 404, { error: "NOT_FOUND" });
  }
  if (p.startsWith("/telegram/") || p.startsWith("/intake/")) return send(res, 200, { channels: [], claims: [] });
  return send(res, 404, { error: "not_found" });
}).listen(4199, "127.0.0.1");
