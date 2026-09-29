// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { cardDate, openCourse, openEditSession, otherDayThisMonth, pickerDate, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC107 —
 * Verify a session's Date can be changed to a past or future date in Edit Session.
 * (From the Courses sheet, Schedule TC017.)
 *
 * Moves a throwaway session to another day of the current month — yesterday (a past date)
 * whenever today isn't the 1st, else tomorrow — so it stays in the loaded list and the helper
 * can still find and delete it. Confirmed live 2026-09-29: the date picker accepts a typed
 * "D MMMM YYYY" + Enter, and Save Changes succeeds ("Session Details updated successfully.").
 */
test("TC107 - Verify a session's Date can be changed to a past or future date in Edit Session", async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const target = otherDayThisMonth();

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.editDateInput().fill(pickerDate(target));
    await courses.editDateInput().press('Enter');
    await expect(courses.editDateInput()).toHaveValue(pickerDate(target));

    await courses.saveChangesButton().click();
    const ok = courses.saveSuccessDialog();
    await expect(ok).toBeVisible({ timeout: 15000 });
    await ok.getByRole('button', { name: 'Back to Schedule' }).click();

    await expect(card).toBeVisible({ timeout: 30000 });
    await expect(card).toContainText(cardDate(target));
  });
});
