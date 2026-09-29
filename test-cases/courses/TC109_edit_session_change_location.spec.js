// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC109 —
 * Verify a session's Location can be entered or changed in Edit Session.
 * (From the Courses sheet, Schedule TC021.)
 *
 * Persistence is checked by leaving the page ("Back to Schedule") and reopening Edit Session,
 * not just by reading the box back. Confirmed live 2026-09-29 that Save Changes succeeds.
 * Throwaway session, deleted afterwards.
 */
test("TC109 - Verify a session's Location can be entered or changed in Edit Session", async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const location = `QA Hall ${Date.now()}`;

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.locationInput().fill(location);

    await courses.saveChangesButton().click();
    const ok = courses.saveSuccessDialog();
    await expect(ok).toBeVisible({ timeout: 15000 });
    await ok.getByRole('button', { name: 'Back to Schedule' }).click();
    await expect(card).toBeVisible({ timeout: 30000 });

    await openEditSession(courses, card);
    await expect(courses.locationInput()).toHaveValue(location);
  });
});
