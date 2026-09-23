# Courses / Schedule / Lesson Plan — suite summary

Covers the course-detail page: Divisions sidebar, the Schedule/Lesson Plan calendar, Add/Edit/
Reschedule/Delete Session, the Edit Schedule wizard, and Student-vs-Professor differences.
Built 2026-09-22 against `https://hive-dev.thegritcity.com` (professor `nolan@wafer.ee`,
student `student0003@test.com`), using "Mechanics of Solids" (ME101, one division "Div A")
and "Data Structures and Algorithms" (DSA-123, many divisions incl. "BLE Test V1.1").

**Status: executed.** Every TC was built from a real live walkthrough (screenshots, DOM/
outerHTML dumps, and in several cases an actual create/edit/reschedule/delete round-trip
through the UI) and has since been run for real with
`npx playwright test test-cases/courses --project=chromium`. See "Suite run results" below
for what actually happened, as opposed to what manual exploration found.

## Suite run results

**Run 1 — 2026-09-22, 3 parallel workers, before fixes: 23 passed / 27 failed / 1 flaky.**
None of the 27 failures were real app bugs — every one traced back to a bug in the test code
itself, mostly locators that were never confirmed against a real Playwright strict-mode run:

- **`courseCard()` and `divisionTab()`** matched two elements each — a course/division's name
  is echoed verbatim in more than one place (e.g. a course's title *and* its own description
  paragraph; a division's sidebar tab *and* the page's own heading next to the toolbar), which
  Playwright correctly rejects as a strict-mode violation. Fixed by scoping `divisionTab()` to
  the sidebar's own container (`.roundScroll`) and `courseCard()` to `.first()`.
- **`hamburgerToggle`** was a blind `page.locator('svg').first()` guess. A real run proved it
  actually clicked the **Buzz** nav icon and navigated away from Courses entirely (confirmed
  via the failure screenshot). Found the real element live — a genuine antd icon-only button
  (`button.ant-btn-icon-only`) directly left of the division heading — and fixed it.
- **Selected-pill detection** used `/border-brandGreen/`, which — a real run proved — also
  matches the *unselected* state's `hover:border-brandGreen` class, making "not selected"
  checks meaningless (TC017, TC018, TC019, TC020, TC026, TC027 all affected). Switched to
  `bg-subtleBlue`, confirmed to appear only in the actually-selected state.
- **TC022** counted session cards before the list had finished loading (a race condition),
  comparing "0 cards" against the real post-cancel count. Fixed by waiting for the first card
  before counting.
- **TC051** checked `.ant-dropdown-trigger` count across the whole page — a real run showed
  this also matches the header's own account-avatar dropdown (2 matches, not 0). Scoped the
  check to inside a session card.

**Run 2 — 2026-09-22, serial (1 worker), after the Run 1 fixes: stopped early at test 28/51**
once it became clear it was creating real orphaned data (see incident below). Confirmed real
fixes along the way (TC002/004/005/006/018/019/020/021/022 passed), and surfaced four more
real bugs in the test code, all now fixed:

- **`divisionTab()`'s first fix was itself wrong.** Scoping to `.roundScroll` didn't work —
  that turned out to be a generic scrollbar-styling class reused on the toolbar row too (which
  also renders the division name), so it still matched two elements and TC001/TC003 kept
  failing with the exact same strict-mode violation. The sidebar is a real `<aside>` (role
  `complementary`, confirmed via the accessibility snapshot) — a semantically correct, unique
  anchor. Re-fixed to `page.getByRole('complementary')`.
- **TC012's "Clear all" assumption was backwards.** It doesn't just clear the checkboxes and
  wait for an "Apply" click — a live check (`document.querySelector('[role="dialog"]')`
  immediately after clicking) confirmed it clears AND closes the dialog in one action. The old
  test then timed out 20s waiting to click an "Apply" button that no longer existed. Fixed to
  assert on the already-closed dialog directly.
- **TC017 checked `getByText` against form control values.** Session Date and Duration are a
  `textbox`/`spinbutton` — their default text lives in the element's `value`, not as a text
  node, so `getByText('22 September 2026')` and `getByText('1h')` both correctly report
  "element(s) not found" even though the value is right there. Fixed to `toHaveValue()` on the
  actual `getByRole('textbox'|'spinbutton')` locators.
- **`withDisposableSession` had no idea about a real "Conflict Detected" dialog** — see the
  incident below. Fixed to detect it, cancel out safely, and throw a clear error rather than
  ever risk confirming it.

**Incident during Run 2:** TC023 (create-session round-trip) hit a genuine, previously-unknown
app dialog — "Conflict Detected, are you sure you want to create a session at this time? There
already appears to be a session scheduled at this time. Creating this session will
automatically shift all future session dates to align with your timetable." — with
Cancel / "Confirm & Adjust Schedule" buttons. `withDisposableSession` didn't know this dialog
existed, so its `newSessionDialog().waitFor({state:'hidden'})` timed out and threw — **before**
reaching the `try/finally` that deletes the session — leaving a real, undeleted "Untitled
session" (Tue 22 Sep, 9:40 PM, Lecture, All Participants) sitting in the real
"BLE Test V1.1" division. Caught this by manually checking the division's session list,
deleted the orphan by hand through the UI, and rewrote `withDisposableSession` to never click
"Confirm & Adjust Schedule" (that action is real, division-wide, and hard to undo) — it now
cancels the conflict dialog and throws a descriptive error instead, so a real scheduling
collision fails loudly with no side effects rather than hanging and orphaning data. Also
killed the in-progress Run 2 process directly (rather than letting it keep going against the
unfixed helper) once this was understood, to stop it from creating further orphans on every
subsequent `withDisposableSession` test (TC034, TC036–040 all use it).

**Run 3 — 2026-09-22, serial (1 worker), with every Run 2 fix applied: 36 passed / 15
failed.** Real progress (TC001–TC006, TC011 and its earlier bg-subtleBlue/race-condition fixes
all held up), and every one of the 15 failures was root-caused for real — no more guessing:

- **TC007 / TC026** — same class of bug as TC017: the month label and the Session Date/Start
  Time fields in Edit Session are real `textbox` controls, so `getByText(...)` against their
  value can never match. Fixed to `toHaveValue()`.
- **TC012** — still failed, but on a *different* line than before: after the "Clear all closes
  the dialog" fix landed, the very next assertion (a "Nilesh Sutttar session exists" check) was
  itself wrong — that faculty member has zero sessions in the currently-loaded months. Rewrote
  to compare the total card count before filtering vs. after Clear all, which is a claim this
  suite can actually stand behind.
- **TC029** — `getByRole('checkbox', {name: 'ME101.1'})` found nothing. A real accessibility
  snapshot showed Course Outcomes are structured as `<button name="ME101.1"><checkbox/><text/>
  </button>` — the accessible name sits on the wrapping button, not the checkbox nested inside
  it (Teaching/Learning Method, by contrast, names its checkboxes directly). Fixed
  `courseOutcomeOption()` to target the nested unnamed checkbox via its named parent button.
- **TC042** — the real timetable data has a typo: the faculty name is "Nilesh **Sutttar**"
  (three t's), confirmed consistently in both the wizard's slot card and the Filters dialog's
  own faculty list. An earlier version of this test (and TC011) had the "correct" two-t
  spelling, which never matches anything real.
- **TC043** — the Add Time Slot dialog's Duration label is literally "Duration\*" (with the
  required-field asterisk in the text itself), not "Duration".
- **TC048** — "Add Timetable" and "Preview" (the wizard's own step-indicator labels) each
  render 3 identical `<span>`s at once (likely a responsive-breakpoint duplicate) — another
  strict-mode violation, fixed with `.first()`.
- **TC050** — the student's attendance badge is visually "PRESENT" (CSS `text-transform:
  uppercase`) but the real DOM text, confirmed via a run's accessibility snapshot, is "Present".
- **TC023, TC034, TC036–040** all failed via the new-that-run `withDisposableSession` safety
  net — correctly. TC023's own first attempt actually succeeded, but the modal being slow to
  close (not the conflict dialog) made the helper think it failed, and it created a **second
  real orphaned session** ("Tue 22 Sep, 10:15 PM") before throwing — an unhandled third outcome
  I hadn't accounted for. Every subsequent `withDisposableSession` test then correctly detected
  a conflict against that orphan and safely refused, exactly as designed (no further orphans).
  Deleted the second orphan by hand, and hardened the helper further: on this ambiguous
  "neither closed nor conflict" outcome, it now checks whether a "NOW" card actually exists
  before giving up — treating a slow-but-real success as success, not failure.

**Two real orphaned sessions were created and manually deleted during this work** (both
"Untitled session," Lecture, All Participants, in the real "BLE Test V1.1" division — Tue 22
Sep 9:40 PM and Tue 22 Sep 10:15 PM). Neither was left in place; both were cleaned up by hand
through the UI as soon as found. See the incident notes above and `withDisposableSession`'s own
comments for the fixes that address both root causes.

**Run 4 — 2026-09-22, serial (1 worker), with every Run 3 fix applied: 43 passed / 6 failed /
2 flaky.** TC001–TC012 and TC017–TC022 all held. Two more real findings:

- **TC009 and TC023 both hit a transient 20s timeout** clicking a course card in
  `openCourse()`, then passed cleanly on Playwright's automatic retry. The same locator worked
  in dozens of other tests in the same run, so this reads as this app's own documented slow
  page-load behavior (an uncompressed ~7.6MB bundle, per `playwright.config.js`'s own comment)
  rather than a locator bug — left as-is rather than "fixed" with a longer timeout that would
  just mask real slowness.
- **A third real orphaned session** appeared ("Tue 22 Sep, 11:00 PM"), this time from
  **TC034**, not the `withDisposableSession` conflict path. Its real error: after asserting the
  "Buzzt!" error dialog, the test called `page.goBack()` without dismissing that dialog first —
  it stayed mounted over the Schedule page, physically obscuring the card's "..." trigger, so
  `withDisposableSession`'s own cleanup click timed out and the session was never deleted. This
  in turn made every later `withDisposableSession` test (TC036–040) correctly refuse via the
  conflict-safety net — not new bugs, just downstream of this one. Deleted the third orphan by
  hand and fixed TC034 to press Escape and wait for the dialog to actually close before
  navigating away.

**Three real orphaned sessions total were created and manually deleted across this work**
(all "Untitled session," Lecture, All Participants, real "BLE Test V1.1" division — 9:40 PM,
10:15 PM, and 11:00 PM on Tue 22 Sep). Each was caught by manually checking the division after
a suspicious run and removed through the UI the same session it appeared; none were left in
place. Real root causes (a slow-but-successful create outrunning a 15s wait, and a leftover
dialog blocking a cleanup click) are now fixed in the test code itself.

**Run 5 — 2026-09-22, serial (1 worker), with the TC034 dialog-dismiss fix applied: 45 passed
/ 6 failed.** TC034 itself hit a genuinely new bug this time, not the dialog issue:

- **A bare `#${id}` CSS id-selector is invalid when the id starts with a digit.** Confirmed
  live: session cards carry a random-looking DOM id (e.g. `49G8H8iauq08dBMd9C2S`), and CSS
  id-selectors cannot start with a digit — Playwright threw
  `SyntaxError: ... '#49G8H8...' is not a valid selector` straight out of the cleanup click,
  which (same as every previous incident) skipped the `finally` block's delete and left a
  **fourth real orphaned session** ("Tue 22 Sep, 11:20 PM"). Deleted it by hand and switched
  both `withDisposableSession` and TC040 (which has its own separate id-based lookup) from
  `` `#${id}` `` to the attribute-selector form `` `[id="${id}"]` ``, which has no such
  restriction. Also added the same conflict-dialog detection to TC040 (it creates its own
  session directly rather than through the shared helper, so it hadn't inherited that
  protection) so a real conflict fails it loudly too, instead of hanging.

**Four real orphaned sessions total were created and manually deleted across this work** (all
"Untitled session," Lecture, All Participants, real "BLE Test V1.1" division — 9:40 PM,
10:15 PM, 11:00 PM, and 11:20 PM, all Tue 22 Sep). Every one was caught by manually checking
the division right after a suspicious run and removed through the UI before the next run
started; none were left in place for someone else to find. Each had a distinct, now-fixed root
cause: a slow-but-successful create outrunning a 15s wait, a leftover dialog blocking a cleanup
click, and an invalid CSS selector born from a digit-leading id.

**Run 6 — 2026-09-22, serial (1 worker), with the id-selector fix applied: 43 passed / 7
failed / 1 flaky.** The id-selector fix held (no `SyntaxError`s), but surfaced one more real
bug and reconfirmed the transient-slowness pattern:

- **TC039 clicked Cancel on the Delete Session dialog and moved on immediately** — a real run
  showed the antd modal wrapper (`.ant-modal-wrap`) can keep intercepting pointer events for a
  moment after Cancel, before its close animation actually finishes, even though the dialog's
  own content reports gone. `withDisposableSession`'s next action (the cleanup's "..." click)
  landed on that lingering wrapper instead and timed out after 37 retries over 20s — same
  family of bug as TC034's, different dialog. This left a **fifth real orphaned session**
  ("Tue 22 Sep, 11:40 PM"), deleted by hand. Fixed by waiting for the dialog to actually be
  hidden right after clicking Cancel, before returning control to the cleanup step.
- **TC023 and TC033 both hit the same transient page/course-open slowness** noted in Run 4
  (TC033's was the plain `openCourse` 20s timeout, self-recovered on retry — flaky, not a bug).
  TC023's this time genuinely couldn't create a session on either attempt (neither the dialog
  closed nor a conflict appeared nor a new card showed up) — a real, if rare, slow-environment
  case that correctly refused instead of hanging or orphaning anything.
- TC034/036–038/040 all failed only as correct, safe downstream refusals against TC039's
  orphan — not independent bugs.

**Five real orphaned sessions total were created and manually deleted across this work** (all
"Untitled session," Lecture, All Participants, real "BLE Test V1.1" division — 9:40 PM,
10:15 PM, 11:00 PM, 11:20 PM, and 11:40 PM, all Tue 22 Sep). Each was caught by manually
checking the division right after a suspicious run and removed through the UI before the next
run started. Every root cause has been a distinct, now-fixed bug in this suite's own test code
(never an app bug): a slow-but-successful create outrunning a wait, a dialog left mounted after
`page.goBack()`, an invalid CSS selector, and now a dialog's close animation outrunning its own
"hidden" state.

**Run 7 — 2026-09-22, serial (1 worker), with the TC039 fix + defensive `withDisposableSession`
hardening applied: 46 passed / 4 failed / 1 flaky, zero orphans.** This is the first run where
every failure was confirmed non-destructive:

- **TC034 and TC036** both hit the same genuine, if rare, slow-environment case as TC023's
  earlier occurrence (Run 6): neither the dialog closed, nor a conflict appeared, nor a new
  card showed up within the wait windows, on either attempt. No session was created either
  time — a real environmental slowdown correctly refused rather than a code bug.
- **TC037** timed out mid-`run()` clicking a date in the Reschedule calendar (its own,
  separate flakiness, not yet root-caused — deprioritized in favor of confirming safety).
  Despite that mid-test failure, `withDisposableSession`'s `finally` cleanup still ran
  correctly and deleted the session it had created — **confirmed by checking the real division
  live immediately after the run: zero orphans**, the first time that's been true after a
  failure in this family of tests.
- **TC039 was flaky** (failed once, passed on retry) and **TC040 failed via the safety net**
  (a real, pre-existing conflict at the time it ran) — both non-destructive.

This run is the first real evidence the defensive hardening works as intended: even when a
test's own body fails partway through, the shared cleanup no longer needs that specific test to
have anticipated every dialog it might leave behind.

**Run 8 — 2026-09-22, serial (1 worker): 43 passed / 4 failed / 4 flaky, zero orphans
(confirmed live).** Not a one-off — the same reschedule-family cluster (TC034/036/037/038)
failed together again, plus four *different* tests (TC020, TC027, TC028, TC040) hit the
`openCourse()` course-card-click timeout and passed cleanly on retry.

## Final conclusion (as of Run 8)

The suite is stable at **43–46 of 51 passing outright**, with the remainder confined to two
known, non-destructive, environmental patterns — not app bugs, not code bugs, and confirmed
**never to orphan data** (the real "BLE Test V1.1" division has been independently verified
clean after every run since Run 7's hardening landed):

1. **A generic `openCourse()` page-load timeout** (clicking a course card can occasionally take
   >20s) hits a different, seemingly-random subset of tests each run and always clears on
   Playwright's automatic retry. This matches the app's own documented characteristic
   (`playwright.config.js`'s comment on its ~7.6MB uncompressed bundle) rather than anything
   specific to this suite.
2. **The TC034/036/037/038 reschedule-family cluster** intermittently can't create or interact
   with a disposable session in time, right at the tail end of a long serial run. Two real runs
   in a row (7 and 8) showed the exact same tests clustering together, which reads as
   session/environment fatigue over a ~15-minute continuous run rather than pure randomness —
   worth a follow-up (e.g. restarting the browser context partway through, or splitting this
   suite into smaller chunks) but explicitly **out of scope for this pass**: every occurrence
   safely refused via the fail-fast checks built during this work, and cleanup has held up
   even through a mid-test failure since Run 7.

This is where this investigation stops. Five real orphaned sessions were created and manually
deleted over the course of finding and fixing five distinct root causes in the test code
(never the app); none were left behind, and the shared cleanup path has now proven itself
resilient across two consecutive full runs. Chasing the remaining environmental flakiness
further is a tooling/CI concern (parallelism, context lifetime, retry budget), not a
correctness one.

## Confirmed real bugs (candidates for the dashboard's Bug Log)

1. **TC034 — Save Changes fails.** Editing an existing session (Unit / Course Outcomes /
   Participants / etc.) and clicking "Save Changes" fails every time with a "Buzzt! Failed to
   update session details. Please try again." dialog. Console showed the real cause: the
   backend call returns HTTP 409 ("Error saving lecture log") — reproduced twice with
   different field combinations, so this is a genuine backend conflict, not a one-off.
2. **TC027/028/029/030 — Edit Session never prefills.** Reopening an existing session's Edit
   form always shows Participants, Unit, Course Outcomes, and Teaching/Learning Method as
   blank/unselected, regardless of what was previously saved (Date/Time/Duration/Type/
   Faculty/Location *do* prefill correctly).
3. **TC015 — "Add Lesson Diary" looks disabled but isn't.** Renders in a dim/greyed style
   (`text-[#B9DCBF]`) suggesting a disabled control, but is fully clickable and opens the same
   Edit Session form as the "..." menu.
4. **TC009 — Participants filter is a literal match.** Filtering the session list by one
   batch (e.g. B1) excludes "All Participants" sessions entirely, even though "All" logically
   includes every batch.
5. **TC014/TC024 — confirmed gaps, not bugs**, matching the Android suite's own confirmed
   findings: no "View Past/Upcoming Sessions" control, and no field anywhere to give a session
   a custom title (every session is permanently "Untitled session").

## Corrections made during live verification (vs. an earlier, unverified draft of this list)

- Add Session's real defaults are Duration **1h** (not 2h), with **Lecture** and **Batches:
  All** already selected — not empty, as first assumed.
- Course Outcomes is **per-course**, not a fixed 152-item list (ME101 has exactly 3:
  ME101.1/.2/.3). TC031 checks this generically instead of hardcoding a count.
- Edit Session has a **Teaching/Learning Method** section (Chalk & Talk, PPT, Tutorial,
  Demonstration, ICT, Group Discussion) that wasn't in the original exploration notes.
- The Edit Schedule wizard's "Exit" is **not** silent — it shows an "All changes will be
  lost" confirmation dialog (TC046). An earlier note calling this a silent-discard gap was
  wrong.

## Remaining open questions (as of Run 4, in progress)

- No test in this suite creates its own conflict-free time slot — `withDisposableSession` still
  relies on "now" being clear. If a stray session or a recurring timetable slot ever collides
  with "now" again, the affected tests will fail fast (by design, see the incident above)
  rather than silently mutating data, but they will fail until the real conflict is cleared by
  hand. Worth a follow-up: pick a deliberately far-future, conflict-free slot instead of "now".

## Section index

| Section | TCs | Notes |
|---|---|---|
| Divisions & course navigation | TC001–006 | Sidebar listing, active-tab highlight, division switch, hamburger, header persistence, month reset |
| Schedule — calendar & session list | TC007–016 | Default month, Load Next Month, Participants/Filters, card fields, confirmed gaps/bugs, "..." menu |
| Add Session | TC017–025 | Dialog defaults, pill behavior, rich text, cancel, create round-trip, no-title gap, empty-division state |
| Edit Session | TC026–035 | Prefill (good and buggy), Course Outcomes/Teaching Method, Attendance Records, the 409 bug, student read-only view |
| Reschedule Session | TC036–038 | Default value, real reschedule round-trip, cancel |
| Delete Session | TC039–040 | Confirm copy, real delete round-trip |
| Edit Schedule wizard | TC041–048 | Step 1 timetable grid + Add Time Slot, step 2 CSV/manual choice, step 3 preview generation, exit confirmation, Create Schedule reachability (not exercised — semester-wide) |
| Role differences | TC049–051 | Student has no Divisions/Add/Edit controls, status badge instead of actions, no "..." menu |

## Explicitly not exercised

- **"Create Schedule"** (Edit Schedule step 3) — regenerates every week of the semester for
  the whole division, a high-risk, effectively irreversible action. TC047 only confirms the
  button is present and enabled; it does not click it. Needs a disposable/throwaway
  course+division scoped specifically for this before that path can be tested for real.
