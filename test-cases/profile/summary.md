# Profile — suite summary

## Status: build complete, one real run attempted but environmentally compromised

This suite (31 test files, 34 test executions counting `test.describe` sub-cases) was built
against `https://hive-dev.thegritcity.com` on 2026-09-21, following the same
verify-against-the-real-app methodology as [Courses](../courses/summary.md) and
[Reports](../reports/summary.md) — every locator and behavioral note comes from a real live
walkthrough, documented in each spec's own header comment.

One real Playwright run exists (`results/run-1790143451200-d32924.json`, 2026-09-23, 8 parallel
workers, headless, retries on) — see "Suite run results" below. It was dominated by
infrastructure failures (test-runner resource exhaustion), not app or test-code defects, so its
pass/fail counts are **not a reliable read on this suite**. A clean re-run is needed before any
real triage can happen.

## Suite coverage

- **Form shape & Edit-mode behavior** (TC001, TC004–TC006, TC022, TC023): the "Edit" button
  unlocks the form in place, which fields stay read-only vs. unlock, and that toggling
  Edit/Cancel repeatedly is consistent.
- **Change Password / Reset Password dialog** (TC002, TC030, TC031): opening the dialog,
  dismissing it via Cancel/Escape/outside-click, and an opt-in real "Send Reset Link" (skipped
  by default).
- **Student academic details & role comparison** (TC003, TC027, TC028): Phone/Enrollment/
  Department/Joining Year populated for students but not the first professor, and College Name
  matching across roles.
- **Access control & session** (TC007, TC008, TC011, TC015): logged-out redirect, the page
  being unreachable from any UI link, session surviving a reload, and re-redirect after logout.
- **Identity matching** (TC009, TC010): the page shows the logged-in account's own name/email
  for a professor, a student, and a second professor (not shared/cached data).
- **Account menu & logout** (TC012–TC014): the top-right avatar menu's identity display and the
  Yes/No logout confirmation dialog.
- **Display Name edit-mode gaps** (TC016–TC019): Cancel's stale-text bug, and missing
  empty/max-length/trim validation.
- **Date of Birth picker** (TC020–TC021): picker opens and selects a date; future dates are not
  disabled.
- **Save Changes persistence** (TC024–TC026): real Save Changes submissions (run as the second
  professor account), all blocked by the app itself.
- **Enrollment label typo** (TC029).

## Confirmed real app characteristics found during live verification

- The web Profile page is a single **11-field form shared by professors and students** — no
  role-specific layout the way Android has (5 fields for faculty, 7 for students).
- Clicking "Edit" unlocks the form **in place** (Cancel/Save Changes replace the Edit button);
  there is no separate Edit Profile screen or pencil icon. Only **Display Name and Date of
  Birth** become editable — First/Last Name, Title, Email, Phone, Enrollment No., College Name,
  Department, and Joining Year all stay disabled even in edit mode.
- Unlike Android (where faculty has no Phone field at all), the **web faculty account does have
  a Phone field**, just empty.
- "Change Password" opens a **"Reset Password" dialog** ("A password reset link will be sent to
  your registered email address..."), not Android's "Verify it's you" screen.
- Student academic info (Phone, Enrollment No., Department, Joining Year) renders as ordinary
  form fields, not the pill badges Android shows.
- **The Profile page has no entry point in the web UI at all** — no sidebar link, no anchor
  pointing at `/profile` anywhere, and the account menu (name/email/avatar) does nothing when
  clicked. It only works if `/profile` is typed directly into the address bar (TC008).
- The account menu (top-right avatar) shows only name, email, and Logout. Logout asks
  "Are you sure you want to Logout" with No/Yes; No keeps the session, Yes ends it and redirects
  to `/login`, after which `/profile` also redirects to `/login`.
- The session survives a page reload.
- The Enrollment No. field's **label reads "Emrolment Number"** (typo); the field's own
  placeholder correctly spells "Enrollment No."
- The Date of Birth picker **does not disable future dates** — a date next year (or later) can
  be selected.
- Display Name has **no empty-value validation, no maximum length** (accepts 120 characters
  tested), and **does not trim** leading/trailing spaces — all with no error message and Save
  Changes staying enabled throughout.
- Clicking Cancel after typing into Display Name returns the form to read-only but **leaves the
  typed text in the field** instead of restoring the saved value (stale UI only — nothing was
  ever saved, so a reload shows the real value again).
- **Save Changes does not persist anything.** Clicking it calls the `EditUser` cloud function,
  which the browser blocks with a CORS error from `hive-dev.thegritcity.com`; the page then
  throws instead of showing any success/error message, and the form stays in edit mode. This is
  the same root cause behind TC024 (Display Name), TC025 (no-op save), and TC026 (Date of
  Birth) all failing to persist.
- The professor and student test accounts belong to the **same college** (College Name matches
  across roles).

## Corrections made during live verification (vs. the Android-sheet originals)

- TC001: Android expects a header pencil icon opening a separate Edit Profile screen; web
  instead has an inline "Edit" button that unlocks the existing form, with only Display Name
  and Date of Birth becoming editable.
- TC002: Android expects a "Verify it's you" screen; web shows a "Reset Password" dialog.
- TC003: Android expects two pill badges under the name; web shows the same information as
  regular (disabled) form fields.
- TC004: Android's exploration found faculty has no Phone field; web confirms faculty **does**
  have one (present, just empty).
- TC005: Android expects exactly 5 fields; web has 11.
- TC006: Android expects 7 fields with student-specific additions (Roll No, Program, Year of
  Joining); web shows the identical 11-field form used for faculty, with no role-specific
  layout.

## Non-destructive-data review

No test in this suite leaves mutated or deleted real profile data:

- **TC024/TC025/TC026** are the only tests that click Save Changes with the intent of
  persisting a change. All three run as the **second professor account** (not the main test
  account) and confirmed live that the save is blocked by the app's own CORS error before
  anything reaches the backend — nothing is actually written. TC024 and TC026 additionally
  restore the original value in a `finally` block as a defensive safeguard in case saving ever
  starts working.
- **TC016–TC019** type edge-case values into Display Name (stale text after Cancel, empty
  value, 120 characters, leading/trailing spaces) but never click Save Changes.
- **TC020/TC021** open the Date of Birth picker and select a date (including a future one) but
  end by clicking Cancel — nothing is saved.
- **TC002/TC030** open the Reset Password dialog but only ever click Cancel/Escape/outside-click
  — Send Reset Link is deliberately never clicked in those tests, since it would email the real
  account.
- **TC031** (the only test that clicks "Send Reset Link" for real) is opt-in only, gated behind
  `HIVE_ALLOW_RESET_EMAIL=1`, and is skipped by default — it has not been run.
- **TC013/TC014** exercise logout, which ends a session but does not mutate stored data.

## Section index

| Section | TCs | Notes |
|---|---|---|
| Form shape & Edit-mode toggle | TC001, TC004–TC006, TC022, TC023 | 11-field shared form, read-only vs. editable fields, repeated Edit/Cancel |
| Change Password / Reset dialog | TC002, TC030, TC031 | Dialog open/dismiss; real send is opt-in and not yet run |
| Student academic details & role comparison | TC003, TC027, TC028 | Phone/Enrollment/Department/Joining Year, College Name across roles |
| Access control & session | TC007, TC008, TC011, TC015 | Logged-out redirect, no UI entry point, reload survives, post-logout redirect |
| Identity matching | TC009, TC010 | Page reflects the logged-in account, not shared/cached data |
| Account menu & logout | TC012–TC014 | Identity display, Yes/No confirmation |
| Display Name edit-mode gaps | TC016–TC019 | Stale text after Cancel, no empty/max-length/trim validation |
| Date of Birth picker | TC020–TC021 | Opens/selects; future dates not disabled |
| Save Changes persistence | TC024–TC026 | Blocked by a CORS error on `EditUser`; nothing persists |
| Enrollment label typo | TC029 | "Emrolment Number" |

## Suite run results

**Run 1 — `run-1790143451200-d32924`, 2026-09-23T06:04:11Z–06:31:56Z (~27.5 min), 8 parallel
workers, headless, retries on: 11 passed / 22 failed / 1 skipped (34 executions).** The failure
pattern is dominated by test-runner resource exhaustion, not app or test-code defects:

- **21 executions ended in `timedOut`**, almost all `Test timeout of 60000ms exceeded` or
  `Tearing down "context" exceeded the test timeout of 60000ms` — a context-teardown timeout is
  a runner/environment symptom (e.g. the browser or OS struggling to close cleanly under load
  with 8 workers), not a locator or app-behavior failure. Affected: TC001, TC002, TC003, TC004,
  TC005, TC006, TC008, TC010, TC011, TC015, TC016, TC017, TC018, TC019, TC020, TC021, TC022,
  TC023, TC024, TC025, TC026.
- **1 execution (`TC009-Student`) failed outright** with
  `Error: browserContext.close: ENOSPC: no space left on device, write` — the host ran out of
  disk mid-run. This is an infrastructure failure, not a test or app issue; notably
  `TC009-Professor`, the same test against a different account, passed cleanly earlier in the
  same run.
- **11 executions passed**: TC007, TC009-Professor, TC012, TC013, TC014, TC027-Professor,
  TC027-Student, TC028, TC029, TC030-Escape, TC030-Outside-click.
- **1 execution skipped**: TC031 (opt-in real-email test, correctly skipped without
  `HIVE_ALLOW_RESET_EMAIL=1` set).

Because 21 of the 22 failures are timeout/teardown symptoms and the 22nd is a disk-space error,
**this run gives no reliable signal on the suite's actual pass/fail state.** The 11 tests that
did pass are a reasonable (if partial) confirmation that the suite runs correctly at all, but
nothing here should be read as "these other 21 tests are broken."

## Next steps

1. Re-run the full suite cleanly with headroom on disk space and fewer/no parallel workers
   (e.g. `npx playwright test test-cases/profile --project=chromium --workers=1
   --reporter=list`) to get a trustworthy pass/fail baseline.
2. Triage whatever fails in that clean run for real — expect to distinguish genuine app/test
   issues from any remaining antd-timing races, the same way Courses and Reports did.
3. Decide whether TC031 (real password-reset email) should ever be run outside a dedicated,
   disposable test account, given it sends a real email to the account under test.
