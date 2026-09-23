// @ts-check
import { expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CoursesPage } from './courses-page.js';

/** Log in with the named credentials (default: the professor account) and land on Buzz. */
export async function loginAs(page, emailKey = 'HIVE_VALID_EMAIL', passwordKey = 'HIVE_VALID_PASSWORD') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential(emailKey), credential(passwordKey));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
}

export const STUDENT = ['HIVE_STUDENT_EMAIL', 'HIVE_STUDENT_PASSWORD'];

/**
 * Course/division fixtures confirmed live 2026-09-22 on the professor account (nolan@wafer.ee).
 * "Mechanics of Solids" has exactly one division so it's used for single-division checks;
 * "Data Structures and Algorithms" has many divisions (used for division-switch checks) and
 * its "BLE Test V1.1" division already has real sessions to exercise Add/Edit/Reschedule/
 * Delete Session against without disturbing other divisions' data.
 */
export const MECHANICS_OF_SOLIDS = { course: 'Mechanics of Solids', division: 'Div A' };
export const DSA = { course: 'Data Structures and Algorithms', division: 'BLE Test V1.1' };

/** Navigates to Courses, opens `course`, and (if given) selects `division`. */
export async function openCourse(page, course, division) {
  const courses = new CoursesPage(page);
  await courses.goto();
  await courses.openCourse(course);
  await courses.tabPill('Schedule/Lesson Plan').waitFor({ state: 'visible', timeout: 20000 });
  if (division) {
    await courses.divisionTab(division).click();
  }
  return courses;
}

/**
 * Leaves the Edit Schedule wizard from wherever it currently is. Confirmed live at step 3
 * (Preview) that "Exit" shows an "All changes will be lost" confirm dialog even with no new
 * edits made this run — not independently reconfirmed at every step, so this handles either
 * outcome rather than assuming the dialog always appears.
 */
export async function exitWizard(courses) {
  await courses.wizardExitButton().click();
  const confirm = courses.wizardExitConfirmDialog();
  if (await confirm.isVisible().catch(() => false)) {
    await courses.wizardExitConfirmCloseButton().click();
  }
}

/**
 * Creates a session via "Add Session" with default values, runs `run(card)`, then always
 * deletes it via the card's "..." menu. Mirrors `withQaPost` in likes-comments-helpers.js.
 *
 * The new card is first found by its "NOW" badge, then pinned to its own DOM `id` (each card
 * root carries a random-looking id, confirmed live) so `card` keeps resolving to the same
 * session even if `run` reschedules it away from "now" — a plain `cardByText('NOW')` would
 * stop matching the instant the date changes.
 *
 * Confirmed live: if the default "now" slot overlaps an existing session (most likely a
 * leftover from an earlier interrupted run), the app shows a real "Conflict Detected" dialog
 * whose confirm button is labelled "Confirm & Adjust Schedule" and explicitly warns it "will
 * automatically shift all future session dates to align with your timetable" — a real,
 * division-wide, effectively irreversible action. This helper NEVER clicks that button. If
 * the conflict dialog appears, it cancels out cleanly and throws instead, so a genuine
 * scheduling collision fails the test loudly rather than risking real data.
 */
export async function withDisposableSession(page, courses, run) {
  await courses.addSessionButton.click();
  await courses.createSessionButton().click();

  const conflictDialog = page.getByRole('dialog').filter({ hasText: 'Conflict Detected' });
  const closed = await courses
    .newSessionDialog()
    .waitFor({ state: 'hidden', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!closed) {
    if (await conflictDialog.isVisible().catch(() => false)) {
      await conflictDialog.getByRole('button', { name: 'Cancel' }).click();
      await page.keyboard.press('Escape').catch(() => {});
      throw new Error(
        'withDisposableSession: the default "now" slot conflicts with an existing session ' +
          '(likely a leftover from an earlier failed run in this division). Refusing to click ' +
          '"Confirm & Adjust Schedule" since it shifts every future session\'s date — clean up ' +
          'the conflicting session by hand, or rerun once its time slot has passed.',
      );
    }
    // Ambiguous: confirmed live that this can also mean the create actually succeeded but the
    // modal was just slow to close (a real run left an orphaned session this exact way — the
    // create request went through server-side well before the modal's own close animation/
    // refetch caught up with a 15s wait). Check reality instead of assuming failure: if a
    // "NOW" card already exists, treat it as created and continue; only give up if it doesn't.
    const maybeCreated = await courses.cardByText('NOW').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!maybeCreated) {
      throw new Error('withDisposableSession: New Session dialog neither closed nor showed a conflict dialog, and no new session appeared');
    }
    await page.keyboard.press('Escape').catch(() => {});
  }

  const freshCard = courses.cardByText('NOW').first();
  await expect(freshCard).toBeVisible({ timeout: 15000 });
  const id = await freshCard.getAttribute('id');
  // Confirmed live by a real run: these ids are random-looking and can start with a digit
  // (e.g. "49G8H8..."), which makes `#${id}` an invalid CSS id-selector (a bare id-selector
  // can't start with a digit) — Playwright then throws mid-click instead of matching anything.
  // The attribute-selector form has no such restriction.
  const card = id ? page.locator(`[id="${id}"]`) : freshCard;

  try {
    await run(card);
  } finally {
    // Confirmed live twice now (a "Buzzt!" error dialog left open after page.goBack(), and a
    // Delete-confirm dialog whose close animation outran its own "hidden" state): a dialog
    // `run` opened or dismissed can still leave an antd `.ant-modal-wrap` intercepting pointer
    // events for a moment. A defensive Escape + brief settle here, regardless of what `run`
    // did, is cheaper than chasing every dialog this suite might ever open one at a time.
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('.ant-modal-wrap').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Delete Session').click();
    await courses.deleteConfirmButton().click();
    await expect(card).toBeHidden({ timeout: 15000 }).catch(() => {});
  }
}
