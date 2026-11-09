# G-42: staging verification plan (web login against the REAL backend)

Status: NOT RUN. The web login (`/api/auth/*`, `/api/session/*`) is verified against a TEST-ONLY stand-in (`e2e/stubBackend.mjs`, 13 session tests). This plan covers what only a real backend can prove. It needs an authorised staging backend and two test accounts; it uses no production data and no shared service key.

## Preconditions
A staging API reachable from the web server (set `TWINS_API_URL` for the web process only), HTTPS in front of the web app (so `Secure` cookies apply), two test accounts (A, B) created by an admin through the backend's own admin route, credentials supplied through the operator's secret store and never written to logs, reports or Git.

## Checks (each records PASS/FAIL, status codes and cookie attributes; never tokens or passwords)
1. **Contract:** `POST /auth/login` returns `{token, expiresAt, user}` and `POST /auth/logout`, `GET /auth/me` behave as the relay expects (the stand-in mirrors `apps/api/src/authApi.ts`).
2. **Cookie:** `tws_session` is HttpOnly, SameSite=Strict, `Secure` over HTTPS, Path=/, lifetime equal to the backend's expiry; `twins_csrf` is readable and SameSite=Strict.
3. **CSRF:** login and logout refuse a missing token, a wrong token and a foreign Origin (403).
4. **Reads:** the intelligence pages load under A's session; the backend log shows `Bearer tws_...` only (never the service key); a client-supplied Authorization header is ignored; non-allow-listed paths are 404 and POST is 405.
5. **Expiry:** after the session expires (admin shortens it or waits) the next read clears the cookie and the page shows sign-in required.
6. **Revocation:** an admin revokes A's session; the next read ends the session the same way; logout revokes at the backend and the old token is 401 afterwards.
7. **Isolation:** A and B in two browsers see only their own results; after A signs out and B signs in on the same browser, none of A's data appears (cache dropped); responses are `no-store`.
8. **Rate limit:** repeated bad passwords are limited by the backend and surface as the rate-limited message.
9. **Headers and bundle:** no token or key in the client bundle (`npm run check:bundle`), no token in any response body.

## Run mode
`E2E_REAL_BACKEND=1` variant of `e2e/session.spec.ts` (not yet written; the stand-in specs show the shape) or the manual checklist above. Evidence is a signed report listing each check, the commit hashes of both repositories and the backend version.

## If no staging backend exists
Everything verifiable locally is already covered (contract shape, relay, cookies, CSRF, isolation, expiry/revocation logic against the stand-in). The staging-only items are 2 (Secure over HTTPS), 5 and 6 against real session rules, and 8.
