# Onboarding (Sign-Up) — suite summary

## Status: build complete, never executed

This suite (18 test cases, `TC001`–`TC018`) was built against `https://hive-dev.thegritcity.com`
on 2026-09-14, mapping the `Onboarding_Test_Cases` sheet in `Hive Test Cases.xlsx` onto the real
web `/signup` page. Unlike Courses and Reports, **no Playwright run of this suite has ever been
recorded** — a search of every file in `results/*.json` (26 historical run files) for any
reference to "onboarding" or a `test-cases/onboarding` path found none; those files only cover
Login, Opportunities, Profile, and Buzz. This document is built entirely from what each spec's
own header comments confirm was checked live in the browser, not from an executed run.

## Suite coverage

- **Discoverability & page shape** (TC001, TC002, TC006–TC008, TC010, TC014, TC016): first-launch
  landing screen, absence of any "Sign Up" affordance on `/login`, and repeated confirmation that
  the spreadsheet's multi-step, role-based mobile wizard (college select → role form → email step
  → password step → verification) does not exist on web at all.
- **Submit-button gating** (TC003, TC004, TC009, TC017, TC018): disabled/enabled states across
  empty, partial, and fully-filled form states, including consent-checkbox gating.
- **Email validation** (TC011, TC012, TC013): malformed email, an already-registered email, and
  an unfamiliar domain.
- **Full registration** (TC015): explicitly not run.

## Confirmed real app characteristics found during live verification

- The real `/signup` page is a **single-step form** — Full Name, Email, Password, Confirm
  Password, one consent checkbox, one submit button — not the spreadsheet's multi-step wizard
  (college select → role-based fields → email step → password step → verification). Documented
  in `signup-page.js`'s own header comment.
- **No "Sign Up" link or button exists anywhere on the login screen**, in either desktop or
  mobile viewport — reaching `/signup` requires navigating there directly (TC002).
- **The submit button's own label reads "Sign in", not "Sign up"** — apparently a copy-paste
  label bug on an otherwise-working registration form (`signup-page.js`).
- **No role concept exists at all**: zero `<select>` elements, and no "student"/"professor"/
  "role"/"department"/"Degree"/"Branch"/"Year of Joining"/"Roll Number"/"Mobile Number" text
  anywhere on the page (TC006–TC008, TC016, TC017).
- Client-side email-format validation does work: an address with no `@` is rejected inline
  ("Please Enter Email in this Valid Format (abcd@mail.com)") without ever reaching the backend
  (TC011).

## Corrections made during live verification

- An earlier assumption that the spreadsheet's steps could be run largely as written did not
  survive contact with the real app — nearly every TC (002, 003, 006–008, 010, 014, 016, 017)
  required reinterpreting or explicitly marking the spreadsheet's mobile-wizard concept as **N/A
  on web**, confirmed by live text/DOM search rather than assumed.
- TC018 started as an adaptation of a phone-number validation case (which has no web equivalent)
  but surfaced a real, reproducible bug instead: **the submit button enables even with the Email
  field left completely empty** — Name, Password, Confirm Password, and consent alone are enough.
  TC009's own field-by-field walkthrough never caught this because it always filled Email
  alongside the other fields, so email's mere presence was never actually tested as a gate.
- TC012 (existing-email submission, run with explicit user sign-off since it hits the live
  backend) found the app gives **no feedback of any kind** — no inline error, dialog, toast, or
  navigation, and no session created (checked Firebase's IndexedDB store directly) — for an
  already-registered email. This is a real UX gap distinct from TC011's working format
  validation.

## Non-destructive-data review

No test in this suite creates a real account. Every test that reaches the submit button either:
stops short of clicking it (TC003, TC004, TC009, TC017, TC018), clicks it with input guaranteed
to be rejected client-side before any backend call (TC011's malformed email), or clicks it with
input guaranteed to be rejected/ignored by the backend using a known pre-existing throwaway
account rather than a fresh identity (TC012, using `nolan@wafer.ee` via `credential('HIVE_VALID_EMAIL')`).

Three cases were deliberately skipped (`test.skip`) specifically to avoid mutating real data:
- **TC005** and **TC015** — a real, valid, unique-email submission would register a genuine new
  throwaway account in the dev database; both stop at "the button reaches enabled" (already
  proven by TC004/TC009) rather than submitting for real, pending explicit sign-off.
- **TC013** — an unfamiliar-domain email has a real chance of succeeding outright (unlike
  TC012's guaranteed-rejected existing email), so the actual submit was never attempted.

No orphaned data, accounts, or sessions were created by this suite's live verification work.

## Section index

| Section | TCs | Notes |
|---|---|---|
| Landing / discoverability | TC001, TC002 | First-launch login screen; no Sign Up link exists; `/signup` works when reached directly |
| Submit-button gating | TC003, TC004, TC009 | Disabled → enabled across empty, partial, and complete form states |
| Role concept (N/A on web) | TC006, TC007, TC008, TC016 | No role dropdown, no role-specific fields, confirmed absent by live text search |
| Page-shape gaps (N/A on web) | TC010, TC014 | No separate email-input or password-setup pages — both fields already on the one screen |
| Email validation | TC011, TC012, TC013 | Format error (works), existing email (no feedback at all — gap), domain restriction (skipped, unverified) |
| Phone number (N/A on web) | TC016, TC017, TC018 | No phone field exists; TC018 surfaced the empty-email submit-button bug |
| Full registration | TC005, TC015 | Both skipped — would create a real account, needs explicit sign-off |

## Next steps

1. Get explicit sign-off (or a designated throwaway account/email) to run TC005 and TC015 for
   real, so a successful registration's actual post-submit navigation can finally be confirmed.
2. Decide whether TC013 (unfamiliar email domain) is worth the risk of a real submission, or
   should stay permanently skipped.
3. Run the suite for real (`npx playwright test test-cases/onboarding --project=chromium`) to
   get this suite's first actual pass/fail data — nothing in `results/*.json` covers it yet.
4. Consider filing the two confirmed gaps as real findings: the submit button enabling with
   Email empty (TC018), and existing-email submissions producing no user-facing feedback
   (TC012).
