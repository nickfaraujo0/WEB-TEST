# Login — suite summary

## Status: executed, real runs confirmed stable, zero failures

This suite (14 test cases, `TC001`–`TC014`) targets the login screen at
`https://hive-dev.thegritcity.com/login`, using the professor account `nolan@wafer.ee` (the
same throwaway dev-build account the DroidSwarm Appium suite signs in with) and a handful of
deliberately-invalid variants for negative cases. Real credential values live in
`credentials.js` (env-var overridable; not reproduced here). Every locator and behavioral claim
in `login-page.js`, `forgot-password-page.js`, `session-helpers.js`, and each spec's own header
comment is stated as either confirmed live or an explicit, labeled gap — see each file's
comments for the specific evidence.

Two real, multi-browser runs of this suite exist in `results/`, both executed through the HIVE
dashboard's live-run pipeline (`_hive-live.mjs` streams screenshots to it while running):

- **`run-1790152664313-d98e8b`** — 2026-09-23 08:37–08:39 UTC, chromium + firefox, 26
  executions (13 TCs × 2 browsers) — **22 passed / 0 failed / 4 skipped**, ~88s. This is the
  ~26-execution run used to verify the dashboard's live ETA feature.
- **`run-1790154182045-e4c324`** — 2026-09-23 09:03–09:07 UTC, chromium + firefox + webkit, 39
  executions (13 TCs × 3 browsers) — **33 passed / 0 failed / 6 skipped**, ~239s.

Every skip in both runs is TC006 and TC008 (×2 or ×3 browsers respectively) — both are
deliberate, documented self-skips (see below), not failures. No other file in `results/` has a
login-suite run beyond these two.

## Suite coverage

- **Core credential paths** (TC001–TC004, TC007): valid login, invalid password, invalid
  (unregistered) email, empty-field submit, malformed email format.
- **Password recovery** (TC005): Forgot Password link → submit → confirmation dialog only (does
  not check actual mailbox delivery — outside what browser automation can verify).
- **Remember Me** (TC006): self-skips live, see below.
- **Deactivated account** (TC008): runs against `student0019@test.com` since 2026-09-25 — `(gap)`, see below.
- **Session expiry** (TC009): simulates a revoked token client-side and checks the redirect.
- **Password field UX** (TC010): mask-by-default and the show/hide toggle.
- **Email normalization** (TC011–TC012): case-insensitivity (works) vs. whitespace padding
  (does not — a real bug, see below).
- **Enter-to-submit** (TC013): pressing Enter in the password field.

## Confirmed real app characteristics found during live verification

- A failed login of any kind (wrong password, unregistered email) shows the **same generic**
  antd `Modal.confirm` dialog — "Login Failed" / "Invalid email or password" — the app does not
  distinguish a bad password from an unrecognized email; both map to Firebase's
  `auth/invalid-credential` (TC002, TC003).
- There is **no client-side required-field or email-format validation**. An empty submit
  reaches Firebase directly (`auth/missing-email`); a malformed email (no `@`) also reaches
  Firebase directly (`auth/invalid-email`). Both surface the same generic "Login Failed" /
  "Login failed. Please try again." dialog — a different body text from the credential-mismatch
  dialog above (TC004, TC007).
- **No "Remember Me" control exists anywhere on the login page** — confirmed live, matching the
  identical absence already found on the Appium/native side. TC006 checks for the control every
  run and throws (rather than silently skipping) if one ever appears, instead of skipping on
  faith forever.
- **Session expiry produces no user-facing message at all.** After a revoked/expired token, the
  app does redirect back to `/login` as expected, but shows no "Session expired" text or any
  message — TC009 explicitly asserts the absence of that text rather than asserting wording that
  will never appear.
- **Password masking works as expected**: `type="password"` by default, and the antd
  `.ant-input-password-icon` toggle switches it to plain text and back (TC010).
- **Email login is case-insensitive** (Firebase Auth's own behavior) — confirmed live before
  writing TC011.
- **Enter key in the password field submits the form**, identical to clicking "Log in" — a real
  native `<form>`/`type="submit"` button, standard browser behavior (TC013).

## Real bug found

- **TC012 — whitespace-padded email cannot log in, despite looking fine.** The email input
  visibly trims leading/trailing whitespace on blur, but the value actually submitted still
  carries the padding. Firebase rejects it (`auth/invalid-email`) and the generic "Login failed.
  Please try again." dialog appears. A user who pastes an email with accidental padding sees a
  trimmed-looking field but still cannot log in.

## Corrections made during live verification

- **TC013 was originally written (and named) "Enter Key Does Not Submit,"** mirroring the
  DroidSwarm Appium suite's finding on the native app. Confirmed live that this does **not**
  carry over to web — Enter submits the form normally. Renamed to "Enter Key Submits The Login
  Form" to match what was actually verified, per this project's rule against asserting a title
  the real behavior contradicts. (This is the same Appium-vs-web scope boundary already noted in
  project memory: only naming/header conventions carry over between the two suites, not
  findings.)
- **TC012's assumption was reversed by live testing.** The title suggested whitespace padding
  should be tolerated (a common accidental user action); live verification showed the opposite —
  it currently breaks login (see bug above).
- **TC002/TC003/TC004/TC007's dialog wording was corrected against the spreadsheet.** The
  spreadsheet's expected text ("Invalid credentials", "Invalid email", "Email and Password are
  required", "Enter a valid email address") does not appear anywhere in the app; the real app
  shows one of two generic dialogs ("Invalid email or password" for credential mismatches,
  "Login failed. Please try again." for empty/malformed input), and the tests assert the real
  text instead.

## Non-destructive-data review

No test in this suite mutates or deletes real stored account data:

- TC001–TC004, TC007, TC010–TC013 only perform login attempts (successful or intentionally
  failed) — no data is created or changed by a login itself.
- **TC009** corrupts a Firebase Auth record to simulate a revoked session, but only inside the
  browser's own local **IndexedDB** (`firebaseLocalStorageDb`) — a client-side-only change, never
  a call to a real backend revoke endpoint. Nothing server-side is touched.
- **TC008 never deactivates anything itself.** It uses `student0019@test.com`
  (`HIVE_DEACTIVATED_EMAIL`), an account the user confirmed was already deactivated, rather
  than deactivating a real test account to manufacture the precondition.
- **TC005 is the one real external side effect**: it submits a real Forgot Password request for
  `nolan@wafer.ee` every time it runs, which sends an actual password-reset email to that real
  inbox. This isn't destructive to any stored data, but — unlike every other test in this suite —
  it does have a real-world effect outside the browser session each run.

No orphaned or leftover data of any kind has ever been produced by this suite.

## Section index

| Section | TCs | Notes |
|---|---|---|
| Core credential paths | TC001–TC004, TC007 | Valid login, invalid password, invalid email, empty fields, malformed email format |
| Password recovery | TC005 | Real reset-email side effect (see above) |
| Remember Me | TC006 | Skipped — no control exists; self-upgrading check |
| Deactivated account | TC008 | `(gap)` — refused with the generic "Invalid email or password"; no deactivation message |
| Session expiry | TC009 | Client-side token corruption; confirmed no "Session expired" message |
| Password field UX | TC010 | Mask-by-default + show/hide toggle |
| Email normalization | TC011–TC012 | Case-insensitive (works) vs. whitespace-padded (real bug) |
| Enter-to-submit | TC013 | Renamed after live verification contradicted the mobile-suite finding |
| End-to-end journey | TC014 | One spec, eight `test.step`s: page → rejections → login → profile menu → session persistence → logout |

## TC008 — Deactivated account (updated 2026-09-25)

Now runs for real with `student0019@test.com` (`HIVE_DEACTIVATED_EMAIL` / `_PASSWORD`), which
the user confirmed is deactivated. Passed on chromium, firefox and webkit. Confirmed live: the login
is refused and the user stays on `/login`, but the dialog is the same generic "Login Failed" /
"Invalid email or password" as a wrong password — Firebase returns `INVALID_LOGIN_CREDENTIALS`, not
`USER_DISABLED` — so the spreadsheet's "Your account is deactivated, contact support" never
appears. Titled `(gap)`; it asserts that absence and will fail if a real message ships. From the
browser, a deactivated account looks identical to a wrong password, so the test depends on the
account staying deactivated with that password.

## TC014 — End-to-end login journey (added 2026-09-25)

One spec that walks the whole lifecycle in a single browser session, reusing `login-page.js`:
masked password + eye toggle → empty submit rejected → wrong password rejected → valid login
(uppercase email, Enter key) lands on `/Buzz` → profile menu shows the account email → reload
keeps the session and `/login` bounces back to `/Buzz` → logout confirm "No" keeps the session →
"Yes" signs out to `/login`, empties `firebaseLocalStorage` in IndexedDB, and `/Buzz` then
redirects to `/login`. Forgot Password is deliberately excluded (TC005's real reset email).

Confirmed live before writing (chromium): the header profile trigger is the
`.ant-dropdown-trigger.justify-end` (no text/accessible name); its menu lists name, email,
"My Profile", "Logout"; logout opens an antd confirm "Are you sure you want to Logout" with
"No"/"Yes".

Things learned while stabilising it:
- Right after a navigation, a click on the profile trigger can be lost while the header
  re-renders (Firefox) — the spec retries the click until the menu is actually open.
- **Rate limit:** the wrong-password step is a real failed attempt on the shared account. Many
  runs in quick succession (`--repeat-each` × 3 browsers) trip Firebase's
  "Login Failed / Too many attempts. Try again later", which then blocks the *valid* login too
  for a few minutes. This also affects TC002 and every other suite that logs in as
  `nolan@wafer.ee` during that window.

## Next steps

1. Fix or file the whitespace-padded-email bug (TC012) — the visible onBlur trim should apply to
   the submitted value too.
2. Revisit TC006 if a "Remember Me" control ever ships — it's built to self-upgrade rather than
   skip silently forever.
2a. Decide whether deactivated accounts should get their own message (TC008 gap) — needs the
   backend to surface USER_DISABLED (or similar) instead of INVALID_LOGIN_CREDENTIALS.
3. Consider whether the missing "Session expired" messaging (TC009) is worth a UX follow-up,
   since the spreadsheet's own precondition expected one.
4. If this suite's run frequency increases, revisit TC005's real reset-email side effect (e.g.
   rate-limiting risk against the real `nolan@wafer.ee` inbox).
