// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC104 —
 * Verify a confirmation pop-up appears after "Update Attendance".
 * (From the Courses sheet, Schedule TC014.)
 * Expected: a confirmation pop-up appears.
 *
 * Confirmed live 2026-09-29: the pop-up shows a green check and "Attendance updated
 * successfully!". Throwaway session, deleted afterwards.
 */
test('TC104 - Verify a confirmation pop-up appears after "Update Attendance"', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.attendanceRecordsButton().click();
    await expect(courses.updateAttendanceButton()).toBeVisible({ timeout: 15000 });

    await courses.updateAttendanceButton().click();

    const popup = courses.attendanceSuccessPopup();
    await expect(popup).toBeVisible({ timeout: 15000 });
    await expect(popup).toContainText('Attendance updated successfully!');
  });
});
