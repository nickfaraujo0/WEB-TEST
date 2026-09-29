// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC103 —
 * Verify "Update Attendance" saves a changed attendance status for the session.
 * (From the Courses sheet, Schedule TC009 + TC013.)
 * Steps: 1. Open Attendance Records. 2. Change one student's status. 3. Update Attendance.
 * 4. Reload and check.
 * Expected: the changed status is saved and shown after a reload.
 *
 * Confirmed live 2026-09-29: every enrolled student starts "Present" on a new session; clicking
 * a student's status pill toggles it (there is no option menu). The Present/Absent totals only
 * change after "Update Attendance" (they reflect the saved record), then read 3 / 1 and survive
 * a reload. Runs on a throwaway session that is deleted afterwards, so no restore is needed.
 */
test('TC103 - Verify "Update Attendance" saves a changed attendance status for the session', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.attendanceRecordsButton().click();
    await expect(courses.updateAttendanceButton()).toBeVisible({ timeout: 15000 });

    const status = courses.attendanceStatus('One Student');
    await expect(status).toHaveText('Present');
    await expect(courses.attendanceCount('Absent')).toHaveText('0');

    await status.click();
    await expect(status).toHaveText('Absent');

    await courses.updateAttendanceButton().click();
    await expect(courses.attendanceSuccessPopup()).toBeVisible({ timeout: 15000 });
    await courses.attendanceSuccessPopup().locator('.ant-modal-close').click();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(courses.updateAttendanceButton()).toBeVisible({ timeout: 30000 });
    await expect(courses.attendanceStatus('One Student')).toHaveText('Absent');
    await expect(courses.attendanceCount('Absent')).toHaveText('1');
    await expect(courses.attendanceStatus('Two Student')).toHaveText('Present');
  });
});
