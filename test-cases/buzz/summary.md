# Buzz — suite summary

## Status (25 Sep 2026): 54 specs / 63 tests, green on all 3 browsers

Full run on the dashboard (run-1790327860804-fb154e, dev, 1 worker, no retries), then re-runs of the fixed specs:

| Browser | Result |
|---|---|
| Chromium | 63/63 passed |
| Firefox | 61 passed; TC052 skipped (Chromium only), TC015 fixme (below) |
| WebKit | 62 passed; TC052 skipped. TC021/TC022 failed once ('Attach Files' not found), then passed on re-run, so they may be flaky on WebKit |

**Fixes from the web-optimisation review:**
- `/Buzz` URLs are now relative.
- Every spec that publishes deletes its post in `finally` (`BuzzPage.cleanupPost`).
- TC050's Edit/Delete is scoped to its own card.
- TC011 is implemented with `HIVE_PROFESSOR2`.
- TC002 pins the last card before scrolling.
- TC020 checks the uploaded chip.
- TC049b uses `TPO_BOARD_URL`.
- `.type()` replaced with `pressSequentially()`.
- TC016/TC018 use `pasteText()`, a real keyboard copy/paste through a temporary textarea. Clipboard permissions are Chromium-only, and the editor ignores synthetic `paste` events.

**Findings:**
- **TC018 (gap):** a pasted URL stays plain text and is never turned into a link.
- **TC052 (gap):** a shared Buzz link shows an "app" page on web, not the post.
- **TC019 (bug):** the image upload never registers.
- **TC032 (bug):** a department-targeted Buzz is visible to other departments.
- **TC040 (gap):** there is no Save as Draft.
- **TC015 on Firefox (fixme, unconfirmed):** text copied from the editor does not paste back into the emptied editor. Copying works, and a plain-text paste works. Check manually in real Firefox.

**New web-only cases:**
- TC051: Copy Link
- TC052: the shared link on web
- TC053: formatting persists after publishing
- TC054: an attached PDF shows on the published card

## TC001–TC015 build notes (earlier)

### Original status (superseded)

This suite (15 test cases, `TC001`–`TC015`, one skipped) was built against
`https://hive-dev.thegritcity.com`, with each locator and behavioral claim in `buzz-page.js`
and each spec's own header comment checked against the real app (confirmed live via DOM/
accessibility inspection and, in several cases, a real publish/edit/delete round-trip) —
see each file's own comments for the specific evidence behind it. There is no `buzz-helpers.js`
in this folder; all page logic lives in `buzz-page.js`, and each spec drives login/setup inline.

**What has NOT happened**: a full, clean run of this suite through to a stable, characterized
pass/fail state. Historical run data (`results/*.json`) only ever exercised a partial subset of
this suite at a time (never all 15 TCs in one run), so there is no single "N passed / M failed"
number for the suite as a whole — see "Suite run history" below for exactly what real data
exists.

## Suite coverage

- **Feed display** (TC001–TC003, TC008): Buzz-as-default-screen after login, feed scrollability,
  visual card separation, and the (N/A on web) creation-timestamp check.
- **Create/Edit/Delete permissions** (TC004–TC006, TC009–TC012): Professor-only create/edit/
  delete, a Student's total lack of a create control, and cross-account checks that a Student
  sees no "..." menu on a Professor's post (TC012, a real two-account test) and that one
  Professor can't touch another's post (TC011, skipped — see below).
- **Share** (TC007): the Email/WhatsApp/Facebook/Copy Link share popover.
- **Composer** (TC013–TC015): opening the composer, typing, and clipboard copy/paste inside the
  Quill.js rich-text editor.

## Suite run history (real data found in `results/*.json`)

Only 3 of the 26 result files in `results/` reference this suite, and between them they cover
6 of the 15 TCs — TC007, TC010, TC011, TC013, TC014, TC015 have no run history at all:

- **`run-1789570421172-214ced.json` (2026-09-16, chromium/firefox/webkit):** TC003, TC006 (both
  sub-tests), TC009 all passed on chromium and webkit. **TC009 timed out on firefox**
  (`Test timeout of 30000ms exceeded`) but passed cleanly on the other two browsers in the same
  run — reads as a one-off, browser-specific slowness rather than a reproducible bug.
- **`run-1789709100772-f222da.json` (2026-09-18):** TC006's "professor sees the button"
  sub-test passed on all 3 browsers.
- **`run-1790153971901-625a55.json` (2026-09-23, chromium only):** TC001, TC003, TC004, TC005
  passed. **TC002 failed for real**, and the error is a genuine bug in the test file itself, not
  the app:
  ```
  TypeError: expect(...).not.toBeInViewort is not a function
      at test-cases/buzz/TC002_buzz_list_scrollable.spec.js:25:30
  ```
  `TC002_buzz_list_scrollable.spec.js:25` called `.not.toBeInViewort(...)` — missing the `p` in
  `toBeInViewport`. **Fixed and re-verified live** (2026-09-24): corrected to `.not.toBeInViewport()`
  and re-ran in isolation — `1 passed (14.6s)`.

No other TC in this suite has any confirmed real pass or fail on record.

## Confirmed real app characteristics found during live verification

- Buzz is confirmed the default post-login screen (same redirect the Login/Opportunities
  suites already assert on), so most specs reach it straight off `LoginPage.login()`.
- The composer is a stock Quill.js ("snow" theme) editor — `.ql-editor` on both the composer and
  every rendered post body, and an unmodified `.ql-toolbar.ql-snow` with Quill's own
  `.ql-bold`/`.ql-italic`/`.ql-underline`/`.ql-link` classes, not app-custom ones.
- The card "..." overflow menu and the Share popover reuse the exact same antd Dropdown
  (`.ant-dropdown-trigger.aspect-square`) and Email/WhatsApp/Facebook/Copy Link component that
  `OpportunityPage` already covers — confirmed live on Buzz, not assumed from that suite.
- Editing a post reopens the identical 4-step wizard, retitled "Edit Buzz" and pre-filled with
  the existing text — the same component as Create, not a separate editor. The one difference:
  step 3's submit button reads **"Save"** in edit mode instead of "Publish"
  (`buzz-page.js` `wizardSaveButton()`).
- A freshly published post is not guaranteed to be first in the feed (the mobile build shows a
  "New Buzz available" banner instead of inserting in place, and the web feed's own ordering has
  not been independently confirmed either way) — tests locate posts by marker text after a
  reload rather than assuming feed order.
- Deleting a post shows a confirmation dialog that names the exact post text being removed
  ("Are you sure you want to delete this Buzz?") before it's final.
- **No creation timestamp renders anywhere on a Buzz card on web** (TC008) — no relative label,
  no `title`/`datetime` attribute on any element — a confirmed absence, contrasted explicitly
  against the mobile app's relative "2h"/"3d" label for the same field.
- The attachment triggers (image/file) in the composer footer have no `<input type="file">` in
  the DOM until clicked, so tests must pair the click with `page.waitForEvent('filechooser')`
  rather than `setInputFiles` on a locator.

## Notes on Student-account behavior found during live verification

- For a Student account, the "All"/board tab bar (`allTab`) is confirmed to never leave its
  loading state (still spinning after 15s+), even though the feed itself renders normally
  underneath it. TC005 and TC006 both deliberately avoid asserting on `allTab` for the Student
  case and instead check that the feed's cards render — the comment flags this tab-bar spinner
  as "worth a separate look" but explicitly out of scope for those tests. This is a real,
  live-confirmed observation, not yet triaged as a bug or expected behavior.

## Deliberately not exercised

**TC011** ("a Professor cannot edit/delete another Professor's Buzz") is **skipped**, not
failed — `test.skip(true, ...)`. It needs a second confirmed-faculty account, and only one
(`HIVE_VALID_EMAIL`) is available to this suite. The file header notes this mirrors the same gap
already recorded on the Appium side (`DroidSwarmQAgent-Knowledge/tests/appium/Hive/Buzz/
summary.md`, "Second account needed" — TC011/TC012/TC028/TC029/TC032), cited only for the shared
naming/gap per this repo's own convention scope, not as evidence about this web suite's behavior.

## Non-destructive-data review

This suite is **not** fully read-only, and cleanup is inconsistent across tests — unlike
Reports (fully read-only) or Courses (which built a single shared disposal helper):

- **TC010** and **TC012** create a real marker post and delete it themselves before finishing
  (`deleteCard()` in `buzz-page.js`, or an inline cleanup step) — self-cleaning.
- **TC004** and **TC009** publish a real marker post to the shared dev feed via
  `composeAndPublish()` and **never delete it** — TC004's marker post and TC009's
  edited-marker post are left permanently in the real feed with no cleanup step in either spec
  file. This is a genuine, confirmed gap in this suite's own hygiene (found by reading the spec
  bodies directly, not from a run), the same class of issue Courses' summary documents at
  length for its own suite, but with no equivalent disposal helper here to catch it.
- **TC013, TC014, TC015** open the composer and type/select/copy/paste text but never click
  Publish, so no real post is created by any of them.
- **TC001, TC002, TC003, TC005, TC006, TC007, TC008, TC011** perform no create/edit/delete
  action at all (TC011 is skipped outright).

No test in this suite touches another user's real data destructively — the one cross-account
test (TC012) only reads another account's view of a post the same test itself created, and
deletes that post itself afterward.

## Section index

| Section | TCs | Notes |
|---|---|---|
| Feed display | TC001–TC003, TC008 | Default screen, scrollability, card separation, no timestamp on web |
| Create/Edit/Delete permissions | TC004–TC006, TC009–TC012 | Professor-only create/edit/delete; Student has none; cross-account visibility; TC011 skipped |
| Share | TC007 | Email/WhatsApp/Facebook/Copy Link popover |
| Composer | TC013–TC015 | Opening the composer, typing, clipboard copy/paste |

## Next steps

1. ~~Fix the confirmed `toBeInViewort` typo in `TC002_buzz_list_scrollable.spec.js:25`~~ — done
   2026-09-24, re-verified live (`1 passed`).
2. Add cleanup to **TC004** and **TC009** (or route both through a shared disposable-post
   helper, mirroring Courses' `withDisposableSession`) so they stop leaving permanent marker
   posts in the shared dev feed.
3. Run the full suite for real (`npx playwright test test-cases/buzz --project=chromium`)
   through to completion and record actual pass/fail counts here — no such run currently exists
   in `results/`.
4. Revisit TC011 if/when a second confirmed-faculty account becomes available.
5. Follow up on the Student-account tab-bar spinner noted under TC005/TC006 — determine whether
   it is an app bug or expected behavior.
