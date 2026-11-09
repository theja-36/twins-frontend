import { describe, expect, it } from "vitest";
import { csrfOk, isAllowedSessionRead, isCsrfToken, isSessionToken, safeParam, sameOrigin, sessionCookieOptions } from "../src/lib/session/server";

const U = "123e4567-e89b-42d3-a456-426614174000", tok = "A".repeat(43);
describe("session cookie and token rules", () => {
  it("only well-formed backend session tokens are ever forwarded", () => {
    expect(isSessionToken("tws_" + "a".repeat(32))).toBe(true);
    for (const bad of [undefined, null, "", "tws_short", "Bearer tws_" + "a".repeat(32), "tws_" + "a".repeat(32) + "\nx", "abc_" + "a".repeat(32), "tws_" + "é".repeat(32)]) expect(isSessionToken(bad as never), String(bad)).toBe(false);
  });
  it("the cookie is HttpOnly, SameSite=Strict, site-wide, and lives exactly until the backend's expiry", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(sessionCookieOptions(new Date(now.getTime() + 3_600_000), true, now)).toEqual({ httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 3600 });
    expect(sessionCookieOptions(new Date(now.getTime() - 5), false, now).maxAge).toBe(0); // an already-expired session never gets a positive lifetime
  });
});
describe("CSRF defences", () => {
  it("same origin: a matching Origin passes; another origin, a malformed Origin, or a cross-site browser request is refused", () => {
    expect(sameOrigin("https://app.example", "app.example", null)).toBe(true);
    expect(sameOrigin("https://evil.example", "app.example", "same-origin")).toBe(false);
    expect(sameOrigin("null", "app.example", null)).toBe(false);
    expect(sameOrigin(null, "app.example", "cross-site")).toBe(false);
    expect(sameOrigin(null, "app.example", "same-site")).toBe(false);
    expect(sameOrigin(null, "app.example", "same-origin")).toBe(true);
  });
  it("double submit: the header must equal the cookie; missing, malformed or different values are refused", () => {
    expect(csrfOk(tok, tok)).toBe(true);
    expect(csrfOk(tok, "B".repeat(43))).toBe(false);
    expect(csrfOk(tok, null)).toBe(false);
    expect(csrfOk(undefined, tok)).toBe(false);
    expect(csrfOk("short", "short")).toBe(false);
    expect(isCsrfToken("x y")).toBe(false);
  });
});
describe("the session read relay is allow-listed and GET-only", () => {
  it("allows exactly the Stage 03 intelligence reads", () => {
    for (const p of ["intelligence/channels", "intelligence/claims", "intelligence/candidates", "intelligence/pipeline", "intelligence/playbooks", "intelligence/archive/channels", `intelligence/channels/${U}`, `intelligence/channels/${U}/performance`, `intelligence/claims/${U}`, `intelligence/claims/${U}/historical-matches`, `intelligence/playbooks/${U}`]) expect(isAllowedSessionRead(p), p).toBe(true);
  });
  it("refuses everything else: other API areas, traversal, odd ids, trailing paths", () => {
    for (const p of ["auth/login", "auth/me", "admin/users", "me/capital", "risk/decisions", "intelligence/estimate", "intelligence/source", "intelligence/channels/not-a-uuid", `intelligence/channels/${U}/other`, `intelligence/claims/${U}/historical-matches/x`, "intelligence/../auth/me", "intelligence/channels/../claims", "", "intelligence/"]) expect(isAllowedSessionRead(p), p).toBe(false);
  });
  it("passes only short, simple query values", () => {
    expect(safeParam("50")).toBe(true); expect(safeParam("claim")).toBe(true);
    for (const v of [null, "", "a b", "a&b=c", "../x", "x".repeat(41)]) expect(safeParam(v as never), String(v)).toBe(false);
  });
});
