// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { cardDate, openCourse, otherDayThisMonth, pickerDate, withSessionLock, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC113 —
 * Verify any date (past or future) can be picked when creating a session.
 * (From the Courses sheet, Schedule TC034.)
 *
 * Creates a session on another day of this month (yesterday — a past date — unless today is
 * the 1st), finds its card by that date + the start time the dialog showed, then always deletes
 * it. Confirmed live 2026-09-29: the date picker accepts typed "D MMMM YYYY" + Enter, and the
 * "All" batch must be picked (it is no longer preselected). Never clicks "Confirm & Adjust
 * Schedule" if a conflict appears — it cancels and fails instead (see withDisposableSession).
 */
test('TC113 - Verify any date (past or future) can be picked when creating a session', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const target = otherDayThisMonth();

  // Takes the same lock as withDisposableSession: parallel copies of this test (e.g. Chromium and
  // Firefox) would otherwise create at the same date + time and conflict.
  await withSessionLock(async () => {
    await courses.addSessionButton.click();
    await expect(courses.newSessionDialog()).toBeVisible();
    await courses.newSessionDateInput().fill(pickerDate(target));
    await courses.newSessionDateInput().press('Enter');
    await expect(courses.newSessionDateInput()).toHaveValue(pickerDate(target));
    const time = await courses.newSessionTimeInput().inputValue(); // e.g. "12:40 AM"

    await courses.batchPill('All').click();
    await courses.createSessionButton().click();

    const conflict = page.getByRole('dialog').filter({ hasText: 'Conflict Detected' });
    if (await conflict.isVisible({ timeout: 3000 }).catch(() => false)) {
      await conflict.getByRole('button', { name: 'Cancel' }).click();
      throw new Error(`TC113: ${pickerDate(target)} ${time} conflicts with an existing session — not confirming "Confirm & Adjust Schedule".`);
    }
    await expect(courses.newSessionDialog()).toBeHidden({ timeout: 15000 });

    const created = courses.cardByText(`${cardDate(target)} at ${time}`).filter({ hasText: 'Untitled session' });
    await expect(created).toHaveCount(1, { timeout: 20000 });
    const id = await created.getAttribute('id');
    const card = id ? page.locator(`[id="${id}"]`) : created;

    try {
      await expect(card).toContainText(cardDate(target));
    } finally {
      await page.keyboard.press('Escape').catch(() => {});
      await courses.cardMenuTrigger(card).click();
      await courses.menuItem('Delete Session').click();
      await courses.deleteConfirmButton().click();
      await expect(card).toBeHidden({ timeout: 15000 }).catch(() => {});
    }
  });
});
