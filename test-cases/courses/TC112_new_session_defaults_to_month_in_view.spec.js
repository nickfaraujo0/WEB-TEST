// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC112 —
 * Verify a new session is created on the date currently in view in the calendar.
 * (From the Courses sheet, Schedule TC033. TC017 only checks the default is today on first open.)
 *
 * Confirmed live 2026-09-29: after moving the month picker to another month, New Session's
 * Session Date defaults to that month (e.g. "29 November 2026" with Nov in view), not today.
 * The date the dialog proposes is what Create Session uses, so this checks it and Cancels —
 * no session is created. Picks the next month (or the previous one in December, since the
 * month panel only lists the current year).
 */
test('TC112 - Verify a new session defaults to the month currently in view in the calendar', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() === 11 ? 10 : now.getMonth() + 1, 1);
  const shortMonth = target.toLocaleString('en-US', { month: 'short' });
  const longMonth = target.toLocaleString('en-US', { month: 'long' });

  await courses.pickMonth(shortMonth);
  await expect(courses.monthLabel).toHaveValue(`${shortMonth}, ${target.getFullYear()}`);

  await courses.addSessionButton.click();
  await expect(courses.newSessionDialog()).toBeVisible();
  await expect(courses.newSessionDateInput()).toHaveValue(new RegExp(`^\\d{1,2} ${longMonth} ${target.getFullYear()}$`));

  await courses.cancelNewSessionButton().click();
  await expect(courses.newSessionDialog()).toBeHidden();
});
