// @ts-check
import { test } from '../_hive-live.mjs';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC013 — Verify error for email not
 * matching domain.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the email input page, enter an email address with a domain
 * that is not allowed. 2. Tap the Continue button. 3. Observe the error message.
 * Expected (spreadsheet): an error message should be displayed for email address with
 * invalid domain.
 *
 * SKIPPED — not a failure. Checked live whether this is a client-side check (like TC011's
 * format validation, which is safe to submit): filled the form with a gmail.com address and
 * found no inline error at all, meaning nothing blocks it before a real submit. Unlike TC012
 * (which reuses a known *existing* account that's guaranteed to be rejected either way), an
 * unfamiliar domain on a fresh, otherwise-valid email has a real chance of actually
 * succeeding — creating a genuine new account — if it turns out web has no domain
 * restriction at all. Per user decision (2026-09-14), that risk wasn't worth taking, so the
 * actual submit was never attempted and this case is left unverified rather than guessed at.
 */
test.skip('TC013 - Verify error for email not matching domain', async () => {
  // Not run — see file header. No client-side domain check exists, and a real submit risks
  // creating an account with an unfamiliar email, which needs explicit sign-off first.
});
