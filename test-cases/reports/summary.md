# Reports (Attendance / Assessment) — suite summary

## Status: build complete, execution not yet confirmed stable

This suite (34 test cases, `TC001`–`TC034`) was built live against
`https://hive-dev.thegritcity.com` on 2026-09-23, following the same methodology as the
[Courses suite](../courses/summary.md): every locator and behavioral assumption in
`reports-page.js`, `reports-helpers.js`, and each spec's own header comment was verified against
the real app (accessibility snapshots, `outerHTML`/`className` inspection, real failed-run
error-context captures) rather than written from memory or guesswork — see each file's own
comments for the specific live evidence behind it.

**What has NOT yet happened**: a full, clean Playwright run of this suite through to a stable,
characterized pass/fail state. Two live run attempts were started (one full run, one resumed
attempt) but were both stopped mid-run at the user's request before the fix/re-run cycle
finished. Whatever failures exist beyond what's noted below (timing races not yet hardened,
an assumption that held during manual exploration but not under Playwright's stricter
actionability checks, etc.) have not yet been triaged. Treat this document as "what was built
and confirmed true about the app," not "what passed."

## Suite coverage

- **Attendance tab, Professor** (TC001, TC003–TC018): navigation/landing, Program/Semester/
  Academic Year/Division dropdowns, Start/End Date pickers, Session Type checkboxes,
  Attendance Threshold, empty-form validation copy, and a real end-to-end "Download Report"
  submission.
- **Assessment tab, Professor** (TC002, TC019–TC026): tab switch/routing, Course dropdown,
  Grading Criteria pills, Assessment Type checkboxes (9, vs. Attendance's 4), optional dates
  (a confirmed contrast with Attendance's required dates), a real end-to-end "Download
  Assessment Report" submission, and the separate "Generate Report Cards" action (validation
  only — see below).
- **Student role, both tabs** (TC027–TC034): the confirmed-simplified Student forms (Academic
  Year + Semester only), the Even/Odd semester pill, a year with only one semester option, real
  end-to-end downloads for both Attendance and Report Card, and confirmation the Student still
  reaches both sub-tabs despite the simpler forms.

## Confirmed real app characteristics (not bugs, but non-obvious)

- The Assessment sub-tab's route is the **plural** `/Reports/Assessments`, even though every
  piece of UI text (tab label, page heading, both role's form titles) says "Assessment"
  (singular).
- Program and Academic Year dropdowns contain real **duplicate options** (e.g. "Chemical
  Engineering" ×3, "Computer Science" ×2) and obvious dev/placeholder data ("df", "Hel", "Just A
  Program") — real dev-environment data, not a locator bug.
- The Attendance Threshold (`InputNumber`, 10–100, step 5, default 100%) is confirmed **pure
  local form state** — changing it and reloading the page brings it straight back to 100%. This
  is the fact that makes it safe for this suite to manipulate freely (TC012–TC014): there is
  nothing server-side to roll back.
- "Download Report" / "Download Assessment Report" / the Student's downloads are confirmed
  **read-only exports** (a `csvBlob` was observed logged to console, plus a real browser
  `download` event during manual verification) — no stored data is created, mutated, or
  deleted by any of them. This is what makes TC017/TC018/TC024/TC030/TC032 safe to exercise
  end-to-end with real submissions rather than stopping at validation.
- Report generation latency is genuinely variable (~3s–~35s observed back-to-back with no
  error either time) — `REPORT_GENERATION_TIMEOUT` (60s) in `reports-helpers.js` exists so that
  alone never causes a false failure.
- Validation copy has three confirmed real typos, reproduced verbatim (not "corrected") in
  TC015: **"Please select a Academic Year!"** (missing "n"), **"Please select an Start Date!"**
  / **"an End Date!"** (wrong article), and **"Please select at least one the Session Types!"**
  (missing "of").
- Student-vs-Professor differences (much smaller forms, different headings/copy, Even/Odd pill
  instead of a dropdown, a lightweight toast instead of a modal) are confirmed **deliberate role
  differences**, not a partially-built page — cross-checked against real enrollment data (e.g.
  2024-25 genuinely has no "Even" semester for this student).

## Deliberately not exercised end-to-end

**"Generate Report Cards"** (Assessment tab, Professor) is a separate, dark/prominently-styled
button confirmed live to be distinct from "Download Assessment Report" — its name and styling
both suggest it compiles and/or officially issues real per-student report cards, a materially
more consequential action than a read-only export. Per this project's standing
non-destructive-data rule, TC025/TC026 stop at confirming the button is present, enabled, and
its own client-side validation fires — the same treatment the Courses suite gave "Create
Schedule" (present/enabled, never clicked through with real data). **This is a genuine, open
gap**: whether "Generate Report Cards" is actually safe to submit for real has not been
determined, and it should be investigated (ideally by asking someone with backend visibility
into what that action does) before ever running it against real data.

## Corrections made during live verification (vs. an earlier, unverified draft)

- **Semester is disabled until Program is selected** — an earlier draft assumed both were
  independently choosable; a real failed run's own accessibility snapshot showed
  `combobox [disabled]` on Semester while Program was still empty.
- **The page heading is not "no semantic heading at all"** — an even earlier version of that
  same comment claimed the app renders no heading elements. Two real failed TC001 runs' own
  error-context snapshots showed a genuine transient `<h2>` loading-skeleton coexisting with the
  persistent `<div>` of the same text immediately after a fresh login — a real strict-mode
  double-match, not a one-off flake, which is why `pageHeading()` scopes to `.first()`.
- **A plain click doesn't always open a Select** — clicking the outer `.ant-select` div can
  succeed as a Playwright action without actually opening the dropdown (TC024 hit this
  directly: `openSelect('Program')` didn't error, but no options ever appeared). The fix
  (`openSelect()` in `reports-page.js`) clicks the inner search input, and separately falls back
  to `force: true` only when the field already has a pre-filled value pinning a sibling
  `.ant-select-selection-item` over the same click target (confirmed live via TC029's own call
  log) — the two races need opposite handling, so one method covers both.
- **The Student's fields aren't wrapped in `.ant-form-item`** — the Professor's fields are a
  full antd Form; the Student's own "Academic Year" field is a plain `<div>` with no Form
  wrapper at all. `selectTrigger()` walks forward from the `<label>` itself so it works for both
  layouts, while `formItem()` (validation-error lookups) stays Professor-only by design.

## Section index

- TC001–TC002: navigation/routing (Attendance default tab, Assessment tab switch)
- TC003–TC007: Professor Attendance filters (Program, Semester, Academic Year, Division)
- TC008–TC009: Start/End Date pickers
- TC010–TC011: Session Type checkboxes
- TC012–TC014: Attendance Threshold
- TC015–TC016: empty-form validation copy and per-field error clearing
- TC017–TC018: real "Download Report" submission and post-success form state
- TC019–TC023: Professor Assessment filters (Course, Grading Criteria, Assessment Types, dates)
- TC024: real "Download Assessment Report" submission
- TC025–TC026: "Generate Report Cards" (validation/presence only — see gap above)
- TC027–TC034: Student role (both tabs, both real downloads, navigation access)

## Non-destructive-data review

No test in this suite creates, mutates, or deletes real stored data. The only stateful control
touched (Attendance Threshold) is confirmed pure local form state (see above). Every "Download"
action exercised end-to-end is a confirmed read-only export. The one action with unconfirmed
real-world consequence ("Generate Report Cards") is deliberately never submitted with real data.
No orphaned-data cleanup has ever been required for this suite, unlike Courses' Add/Edit/
Delete-Session work — Reports has no equivalent create/mutate surface to leave orphans in.

## Next steps

1. Run the full suite for real (`npx playwright test test-cases/reports --project=chromium
   --retries=1 --workers=1 --reporter=list`) through to completion and record actual pass/fail
   counts here.
2. Root-cause and fix whatever fails — expect at least the same class of antd-timing races
   already documented in `courses/summary.md`, since this suite uses the same UI toolkit.
3. Decide on "Generate Report Cards" (see gap above) before ever exercising it for real.
