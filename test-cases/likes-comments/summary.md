# Likes & Comments (Buzz) — suite summary

## Status: build complete, no live run recorded

This suite (34 test cases, `TC001`–`TC034`) targets the like/comment/reply controls under a
Buzz post on `https://hive-dev.thegritcity.com`, built the same way as the
[Courses](../courses/summary.md) and [Reports](../reports/summary.md) suites: every locator and
behavioral claim comes from a comment in the spec file itself, stated as "confirmed live"
against the real app rather than written from memory. Unlike those two suites, **no Playwright
run of this suite has been recorded** — a search of every file in `results/*.json` (26 run
files, covering Login, Buzz-creation, Opportunities and Profile suites) found zero references to
any `likes-comments` file path or test title. There is no pass/fail history to report here, and
none was fabricated. This document reflects what the test code and its header comments assert,
not what a run confirmed.

## Suite coverage

- **Post-level likes** (TC001–TC008): like/unlike a post, a like surviving reload, a like being
  per-user ("You" vs "1 other" vs "You and 1 other" across two accounts), confirming there is no
  five-reaction picker on hover/long-press, confirming there is no way to see a list of who
  liked, and an accessibility check on the like/comment/share icons.
- **Comment posting & validation** (TC009–TC020): opening/closing the inline comment section,
  empty and whitespace-only comments being silently rejected, Enter adding a newline instead of
  sending, a comment appearing at once then saving, author/department/relative-time display, a
  comment surviving reload, the "N comments" count label, another account seeing a posted
  comment, the emoji picker, and HTML being rendered as plain text.
- **Comment/reply edge cases and bugs** (TC021–TC025): a multi-line comment losing its line
  break, a long unbroken comment overflowing the card, no max length on the comment box, the
  author name changing from first-name-only to full name after reload, and the comment count
  going stale after replies until a reload.
- **Comment/reply likes and nesting** (TC026–TC034): liking/unliking a comment ("Like" ↔ "Love"
  + "You"), Reply opening a reply box, replies nesting newest-first with no Reply button on a
  reply, replies hidden behind a "View N Replies" toggle until expanded, liking/unliking a
  reply, replying to your own comment, and confirming no reaction picker on a comment's Like
  either.

## Confirmed real bugs (per spec-file header comments, tagged "(bug)")

1. **TC008 — like/comment/share icons have no role, label, or keyboard focus.** Plain
   div/svg elements with no `role`, `tabindex`, `aria-label`, or nested button/link — unreachable
   by keyboard or screen reader.
2. **TC021 — a multi-line comment (Shift+Enter) loses its line break.** The bubble renders with
   `white-space: normal`, so two typed lines collapse into one (`"line one line two"`).
3. **TC022 — a long unbroken comment (700 chars, no spaces) overflows the card**, running past
   its right edge instead of wrapping.
4. **TC023 — the comment box has no maximum length**, accepting a 700-character string
   (`maxLength` reads `-1`).
5. **TC024 — the comment author's displayed name changes after reload**: "Nolan" (first name
   only) immediately after posting, "Nolan Dmello" (full name) once the page is reloaded.
6. **TC025 — the post's comment count label goes stale after replies.** Posting two replies to a
   comment leaves the label at "1 comment"; only a reload brings it to the real total ("3
   comments").

## Confirmed gaps / real differences vs. the app (not classed as bugs)

- **TC006/TC034 — no reaction picker on web.** Hovering or long-pressing the post heart or a
  comment's "Like" opens no popover on either surface; the web has a single like reaction, not
  the app's five-reaction picker.
- **TC007 — no way to see who liked a post.** Clicking the "You" like-summary text opens nothing
  (no dialog/modal/drawer).
- **TC030 — replies are fully hidden behind a "View N Replies" toggle** after reload, rather than
  the app's pattern of showing the first reply plus a "View more replies" link.

## Confirmed real app characteristics (non-bug, non-obvious)

- A posted comment renders immediately, dimmed via `.cursor-progress`, until the `createComment`
  cloud function returns (documented as taking several seconds) — several specs (TC014, TC017,
  TC020, etc.) extend `test.setTimeout` to 120–180s to accommodate this.
- The emoji picker beside the comment box is `EmojiPickerReact`, categorized (e.g. "Smileys &
  People"), with emoji buttons at `button.epr-emoji`.
- HTML typed into a comment (`<b>bold</b> <script>alert(1)</script>`) is confirmed rendered as
  literal text, never live markup — a passing security check, not a bug.
- A reply offers only a "Like" control, never its own "Reply" button (no reply-to-a-reply).
- Comments/replies render as `div.py-2`; the send control for both the comment and reply boxes is
  the last `svg` two ancestor-levels up (no named "Send" button); the emoji button is the first.

## Non-destructive-data review

Every one of the 34 specs runs through `withQaPost(page, label, run)` (in
`likes-comments-helpers.js`): it creates a brand-new, clearly-marked disposable Buzz post
(`QA <label> <timestamp> (safe to delete)`), hands it to the test body, then **always** calls
`post.remove()` in a `finally` block — even the two-account tests (TC004, TC005, TC018) that
open a second `STUDENT` browser context only ever like/comment on that same disposable post.

- **No test likes or comments on a real, pre-existing post.** All mutation (likes, comments,
  replies) happens exclusively on the throwaway post created for that test.
- **Cleanup deletes the whole post**, which per `QaPost`'s own comment removes every like and
  comment on it too. `remove()` waits for the first feed card to render after a reload (so it
  doesn't miss the post during the feed's brief empty-refresh state) and waits for the real
  `deleteAnnouncement` network response before trusting the deletion, rather than trusting the
  card disappearing from the DOM.
- **Cleanup is best-effort, not guaranteed.** If `remove()` itself fails (e.g. the delete
  network call times out or errors), it does not throw or fail the test — it `console.warn`s the
  exact marker text and asks for manual deletion. This means an orphaned disposable post is
  possible in principle if the app-side delete misbehaves, though nothing in the spec files or
  results indicates this has ever actually happened (no run of this suite has been recorded at
  all — see Status above).
- No real user-authored content is ever mutated or deleted by this suite.

## Section index

| Section | TCs | Notes |
|---|---|---|
| Post-level likes | TC001–TC008 | Like/unlike, reload persistence, per-user display, no picker, no who-liked list, icon a11y |
| Comment posting & validation | TC009–TC020 | Open/close section, empty/whitespace rejection, Enter behavior, save timing, author/time, count label, cross-account visibility, emoji picker, HTML escaping |
| Comment/reply bugs | TC021–TC025 | Line-break loss, overflow, no max length, author-name reload bug, stale count after replies |
| Comment/reply likes & nesting | TC026–TC034 | Like/unlike a comment or reply, Reply box, nesting order, hidden-behind-toggle replies, own-comment reply, no picker on comment likes |

## Next steps

1. Run the suite for real (`npx playwright test test-cases/likes-comments --project=chromium`)
   and record actual pass/fail counts and any new findings here — this document currently
   reflects only what the test code claims, never what a run has verified end to end.
2. Confirm live whether `withQaPost`'s best-effort cleanup has ever actually left an orphaned
   "QA ... (safe to delete)" post behind, the way Courses' `withDisposableSession` did — check
   the real Buzz feed for stray QA posts before and after the first real run.
3. Decide whether the confirmed bugs (TC008, TC021, TC022, TC023, TC024, TC025) should be added
   to the dashboard's Bug Log, matching how the Courses suite's confirmed bugs were logged.
