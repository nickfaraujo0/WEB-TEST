# Opportunities (Events / Jobs / Internship) — suite summary

## Status: build complete; only the Events extension (TC025–TC027) has real run data

This suite (27 test files, `TC001`–`TC027`, several split per opportunity type — e.g.
`TC006-Jobs`/`TC006-Internship`) was built live against `https://hive-dev.thegritcity.com`,
covering the "Events & Opportunities" page (`/opportunity/`) reachable via the sidebar's
"Opportunity" link. TC001–TC024 were built 2026-09-16/18 from the Hive Test Cases.xlsx sheet
"create & display jobsinternship" and originally only ever created Jobs (TC004) and Internship
(TC005) listings — Events had zero coverage. TC025–TC027 (not in the spreadsheet) were added
2026-09-18 specifically to close that gap, confirmed live before writing them (own Event Type
default, shared `.ant-select.eventType` dropdown, dual Registration-Deadline/Event-Date fields).

Every locator and behavioral claim in `opportunity-page.js`, `create-opportunity-page.js`, and
each spec's own header comment is stated to be confirmed against the real app — see each file's
comments for the specific live evidence. **What has NOT happened**: a full, clean run of
TC001–TC024. The only real Playwright run data found in `results/*.json` covers TC025–TC027
plus one cancelled full-suite attempt that only captured two tests before being stopped (see
"Suite run results" below). Treat this document as "what was built and confirmed true about the
app," not "what passed," for TC001–TC024.

## Suite coverage

- **Navigation & tabs** (TC001–TC003, TC024): sidebar link → page, Events/Jobs/Internship tab
  switching, the Create Opportunity dropdown menu and its click-outside-to-close behavior.
- **Create Jobs/Internship/Events forms** (TC004–TC008, TC015, TC025–TC027): form loads per
  type, the shared Job/Event Type dropdown switching field labels, mandatory-field validation
  gating the Preview step, the (non-existent) Eligibility field, and Events' own sub-categories
  and dual date fields.
- **Deadline & registration link behavior** (TC009–TC010, TC018): deadline display, publishing
  without a deadline, and whether an expired deadline blocks applying.
- **Listing display & feed** (TC011–TC012, TC016): infinite-scroll feed layout, scrollability,
  and the live "Register" link.
- **File upload** (TC013–TC014): attaching a normal file, and the silent failure on an
  oversized one.
- **Share feature** (TC017, TC019–TC020, TC022–TC023): the "..." card menu, the Share dialog's
  real options, Copy Link's clipboard behavior, and role scope (professor vs. student).
- **Role differences** (TC021–TC023): Create Opportunity button and card-menu options
  (Edit/Unpublish) are professor-only.

## Confirmed real app characteristics found during live verification

- There is no literal "plus icon" — the control is a labelled **"Create Opportunity"** button
  that opens a dropdown menu (not a modal pop-up) with Create Event/Create Jobs/Create
  Internship links (TC003).
- There is no button literally labelled "Publish" on the create form — its submit button is
  always visible/enabled and labelled **"Preview"**; the real "Publish" button only exists on
  the Preview page reached after mandatory fields validate (TC007).
- The navbar header is stuck reading **"Create Event" / "Preview Event"** regardless of the
  actual type being created, even though the in-page heading and field labels are correct
  (`create-opportunity-page.js` header comment).
- Share lives behind a **"..." dropdown menu** on each card (not a standalone button), with
  options Email/WhatsApp/Facebook/Copy Link (TC017, TC019, TC020).
- **Copy Link copies a full share message** (title/description text) with a real deep link
  embedded at the end, not a bare URL (TC019, TC022).
- The live, published apply control is labelled **"Register"**, not "Apply Now" — "Apply Now"
  only appears (disabled) on the pre-publish Preview step (TC016).
- Card "..." menu triggers render **two DOM elements per card** (a hidden zero-size duplicate
  plus the real visible one); `opportunity-page.js`'s `openFirstCardMenu()` tries each visible
  trigger in turn rather than trusting a fixed index, because a specific index was occasionally
  unresponsive.
- The Job/Event Type dropdown (`.ant-select.eventType`) is **shared across all three types** —
  opening it from the Events form lists Events' own five sub-categories (Webinars and
  Workshops, Contests, Cultural Events, Sports Events, Field Trips) plus "Jobs" and
  "Internship" as top-level switches, and picking one is a real, working way to switch forms
  (TC026).
- **Create Event has two independent date/time pairs** — "Registration Deadline" and "Event
  Date" — versus Jobs/Internship's single deadline (TC027).
- Students' "..." menu shows only **View/Share**; professors additionally get **Edit/Unpublish**
  (TC022).
- The **Create Opportunity button is professor-only**, confirmed live for both roles (TC021).

## Confirmed real bugs / gaps (candidates for the dashboard's Bug Log)

1. **TC009 — Deadline never displays a time.** Setting only a deadline date (leaving the
   separate, optional time picker empty) never shows "11:59 PM" or any time, either on the
   Preview step or the live published card. The spreadsheet's expected midnight-default
   behavior does not exist on web.
2. **TC014 — Oversized file upload fails completely silently.** Selecting a ~29MB file produces
   no filename in the "Attach Files" modal, no inline error, no toast, and no console error —
   the file is rejected without telling the user anything happened.
3. **TC018 — Register link stays active after its deadline has passed.** A real seeded Jobs
   listing ("sasas", deadline 9 January 2025, long past) still has a fully active Register
   link: not disabled, `pointer-events: auto`, real working href. Nothing blocks or warns about
   applying after the deadline.
4. **TC008 / TC015 — No "Eligibility" field exists** anywhere on the real create form for Jobs
   or Internship, confirmed by reading the full rendered form for both types (N/A on web,
   documented rather than skipped).
5. **TC020 / TC023 — No "share to Buzz" option exists** in the Share dialog for either role;
   options are Email/WhatsApp/Facebook/Copy Link only, byte-for-byte identical between professor
   and student (N/A on web).

## Corrections made during live verification (vs. the spreadsheet's original expectations)

- The "plus icon" is a labelled "Create Opportunity" button opening a dropdown menu, not a
  modal pop-up (TC003).
- "Apply Now" is only the pre-publish Preview label; the live button is "Register" (TC016).
- The application deadline does not default to a displayed "11:59 PM" — no time is ever shown
  for a date-only deadline (TC009).
- No Eligibility field/dropdown exists to test single- or multi-domain selection against
  (TC008, TC015) — the spreadsheet's premise for both cases doesn't hold on web.
- There is no "share on Buzz" capability to scope to professors only — the feature itself
  doesn't exist for either role (TC020, TC023).

## Suite run results (from `results/*.json`)

Only four run files in `results/` reference this suite's spec paths, and three of those cover
only the later Events additions (TC025–TC027); the fourth is a cancelled full-suite attempt
that captured just two tests before stopping. No run data exists for the bulk of TC001–TC024.

- **`run-1789710395626-1918a6`, 2026-09-18 05:46, chromium, 1 worker: 2 passed / 1 failed.**
  TC025 passed, TC027 passed. **TC026 failed** on a real Playwright timeout inside
  `selectJobType()`: clicking the "Jobs" option timed out after 20s — a container div
  (`xs:px-[2rem] max-w-[800px] mx-auto`) intercepted pointer events, then the option
  alternated between "not stable" and "not visible" across dozens of retries.
- **`run-1789710490797-d65472`, 2026-09-18 05:48: 1 passed / 0 failed.** TC025 alone, passed.
- **`run-1789710527296-915498`, 2026-09-18 05:48: 1 passed / 1 failed.** TC026 **failed again**
  with the exact same click-interception timeout and error signature as the first run —
  confirming this is reproducible, not a one-off flake. TC027 passed.
- **`run-1789728607345-7402ad`, 2026-09-18 10:50, chromium+firefox+webkit, 4 workers: cancelled.**
  An attempted full-suite run (47 cases expected, 141 executions expected across 3 browsers) was
  stopped after capturing only 2 executions: **TC001 and TC003 both hit Playwright's 60s
  test-level timeout** (`status: "timedOut"`) before the run was cancelled. No conclusion can be
  drawn beyond "cancelled early" — this is not evidence TC001/TC003 are broken, only that they
  didn't finish before cancellation.

**Honest bottom line**: TC001–TC024 have never been run to a completed, characterized pass/fail
state — the only real run data available is for the three later Events-focused additions
(TC025–TC027), and even within that small sample, **TC026 failed twice in a row** with the same
real, reproduced timeout in `selectJobType()`'s option click. That locator/timing issue has not
yet been root-caused or fixed.

## Non-destructive-data review

- **TC009 and TC010 explicitly create real "QA Test" listings in the dev database on every
  run** (one per Jobs/Internship type, so up to 4 listings per full run of both). Both files'
  header comments state this plainly and note **explicit user sign-off (2026-09-14)** was
  obtained before writing them, "same category as an account-creating submission." Titles are
  prefixed `QA Test -` and suffixed `(safe to delete)`; TC010 additionally appends
  `Date.now()` to avoid title collisions across runs.
- **Fixed 2026-09-24**: added `opportunities-helpers.js`'s `cleanupOpportunityByTitle()`, a
  best-effort teardown (mirroring Courses' `withDisposableSession` in spirit, though there is no
  "Delete" action to call — only "Unpublish", confirmed live as the only destructive-looking
  option on a listing card's "..." menu, and it takes effect immediately with no confirmation
  dialog). TC010's Jobs/Internship tests now call it in a `finally` block after their
  assertions. **TC009 was also changed** to complete the Publish step itself (previously it
  stopped at Preview) and then run the same cleanup — confirmed live via network capture that
  clicking "Preview" alone already fires the real `CreateEvent` endpoint, so TC009 was creating
  a real backend record either way; publishing-then-unpublishing leaves it in a known state
  instead of an orphaned draft. All 4 cases (TC009-Jobs, TC009-Internship, TC010-Jobs,
  TC010-Internship) re-run live and passed with this change (`4 passed`, ~2.6 min for all four
  together). Titles are now unique per run (`Date.now()`-suffixed) for both TC009 and TC010 so
  cleanup targets exactly the listing just created. Note: the app has a confirmed, unexplained
  intermittent delay before a freshly published card appears in its tab's feed — the cleanup
  helper retries up to 4 times with fresh navigations, and swallows a lookup miss via
  `console.warn` rather than failing the test, since this is best-effort cleanup, not a
  correctness assertion.
- **TC007b-Jobs and TC007b-Internship** fill the form and click through to a live Preview page
  (also titled `QA Test - TC007b-... (safe to delete)`) but stop at confirming the Publish
  button is visible — they never click Publish, so no listing is actually published from these
  two tests.
- TC004–TC008, TC015, TC025, TC026, TC027 open create forms and interact with fields/dropdowns
  but deliberately never submit — no data is created by these.
- TC013/TC014 upload a file into the create form's attachment control but never submit the
  form, so nothing is persisted server-side.
- TC017, TC019, TC020, TC022, TC023 (Share) only read existing listings and copy a link to the
  clipboard — no mutation of stored data.
- No test in this suite unpublishes, edits, or deletes an existing real listing.

**Overall**: this suite has a confirmed, sanctioned real-data-creation path (TC009/TC010) that
now has automated best-effort cleanup (as of 2026-09-24) — running it repeatedly should leave
listings unpublished rather than accumulating live "QA Test" clutter, though cleanup can silently
no-op on the app's own intermittent feed-visibility delay (see above).

## Section index

| Section | TCs | Notes |
|---|---|---|
| Navigation & tabs | TC001–TC003, TC024 | Sidebar link, tab switching, Create Opportunity menu open/close |
| Create form — Jobs/Internship | TC004–TC008, TC015 | Form loads per type, type-dropdown switching, mandatory-field gating, no Eligibility field |
| Deadline & registration link | TC009–TC010, TC018 | No time ever shown, publish without deadline, expired-deadline bug |
| Listing display & feed | TC011–TC012, TC016 | Infinite-scroll layout, scrollability, live Register link |
| File upload | TC013–TC014 | Normal upload works, oversized upload fails silently (bug) |
| Share feature | TC017, TC019–TC020, TC022–TC023 | "..." menu, dialog options, Copy Link clipboard behavior, role scope |
| Role differences | TC021 | Create Opportunity button professor-only |
| Events extension (not in spreadsheet) | TC025–TC027 | Create Event form, shared type dropdown incl. sub-categories, dual date fields |

## Explicitly not exercised end-to-end

- **TC007b-Jobs / TC007b-Internship** stop at confirming the Publish button is visible on the
  Preview page — the button itself is never clicked, so no listing is published from these.
- **TC025–TC027 (Events)** never submit the create form — doing so would create a real event in
  the dev database, and this gap is called out explicitly in TC025's own header comment.

## Next steps

1. Run the full suite for real (`npx playwright test test-cases/opportunities --project=chromium`)
   through to completion and record actual pass/fail counts here — TC001–TC024 currently have
   no real run history at all.
2. Root-cause and fix the TC026 `selectJobType()` click-interception timeout — reproduced
   identically in two separate real runs, so it is a genuine, repeatable issue rather than a
   one-off flake.
3. ~~Add a disposable-listing cleanup path for TC009/TC010~~ — done 2026-09-24
   (`cleanupOpportunityByTitle` in `opportunities-helpers.js`), re-verified live.
4. Confirm TC018-Internship actually finds a past-deadline listing when run — per its own
   comment, it will time out if the dev database has no such Internship listing seeded.
