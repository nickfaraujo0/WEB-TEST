// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC108 —
 * Verify a session's Duration can be changed in Edit Session.
 * (From the Courses sheet, Schedule TC018 — the mobile app had a Duration picker bug here.)
 *
 * Confirmed live 2026-09-29: on web Duration is a number box (hours, antd InputNumber, "1" for a
 * default session), and a session card's header ends with its duration, e.g. ", 1hr".
 * Throwaway session, deleted afterwards.
 */
test("TC108 - Verify a session's Duration can be changed in Edit Session", async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await expect(card).toContainText('1hr');
    await openEditSession(courses, card);
    await expect(courses.durationInput()).toHaveValue('1');

    await courses.durationInput().fill('2');
    await courses.saveChangesButton().click();
    const ok = courses.saveSuccessDialog();
    await expect(ok).toBeVisible({ timeout: 15000 });
    await ok.getByRole('button', { name: 'Back to Schedule' }).click();

    await expect(card).toBeVisible({ timeout: 30000 });
    await expect(card).toContainText('2hr');
  });
});
