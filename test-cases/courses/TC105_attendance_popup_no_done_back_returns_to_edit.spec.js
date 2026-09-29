// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC105 —
 * Verify "Done" on the confirmation pop-up returns to Edit Session.
 * (From the Courses sheet, Schedule TC015 — a mobile-app flow.)
 *
 * Confirmed live 2026-09-29: on web the pop-up has NO "Done" button — only a close (×) — and
 * closing it leaves the user on the Attendance page. Going back from there returns to the
 * session's Edit Session view. So this asserts the web behaviour: no Done, × closes and stays,
 * and back returns to Edit Session. Throwaway session, deleted afterwards.
 */
test('TC105 - Verify the attendance pop-up has no "Done"; closing stays and back returns to Edit Session (N/A on web)', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await courses.attendanceRecordsButton().click();
    await expect(courses.updateAttendanceButton()).toBeVisible({ timeout: 15000 });

    await courses.updateAttendanceButton().click();
    const popup = courses.attendanceSuccessPopup();
    await expect(popup).toBeVisible({ timeout: 15000 });
    await expect(popup.getByRole('button', { name: /^Done$/i })).toHaveCount(0);

    await popup.locator('.ant-modal-close').click();
    await expect(popup).toBeHidden();
    await expect(page).toHaveURL(/\/Courses\/edit-attendance/);

    await page.goBack();
    await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/Courses\/editLog/);
  });
});
