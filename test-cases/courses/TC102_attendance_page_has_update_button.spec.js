// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC102 —
 * Verify the Attendance Records page shows an "Update Attendance" button.
 * (From the Courses sheet, Schedule TC012.)
 * Precondition: Professor, in a division that has sessions.
 * Steps: 1. Open a session's Edit Session. 2. Click "Attendance Records".
 * Expected: "Update Attendance" is visible on the attendance page.
 *
 * Confirmed live 2026-09-29: Attendance Records opens /Courses/edit-attendance (breadcrumb
 * "Schedule > Unnamed Lecture > Attendance") with Present/Absent totals, one row per enrolled
 * student and a fixed "Update Attendance" button. Uses a throwaway session so no real
 * session's attendance is touched.
 */
test('TC102 - Verify the Attendance Records page shows an "Update Attendance" button', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.attendanceRecordsButton().click();

    await expect(page).toHaveURL(/\/Courses\/edit-attendance/);
    await expect(courses.updateAttendanceButton()).toBeVisible({ timeout: 15000 });
    await expect(courses.updateAttendanceButton()).toBeEnabled();
    await expect(courses.attendanceRow('One Student')).toBeVisible();
  });
});
