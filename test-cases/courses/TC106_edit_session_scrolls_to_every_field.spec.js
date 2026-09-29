// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC106 —
 * Verify the Edit Session form scrolls to reveal every field down to Save Changes.
 * (From the Courses sheet, Schedule TC016.)
 *
 * Confirmed live 2026-09-29: on web, Save Changes and Attendance Records sit in the page header
 * (top), and the form runs down through Participants, Planned/Covered Topic, Faculty, Location,
 * Unit, Course Outcomes and Teaching/Learning Methods to "Delete Session Records" at the very
 * bottom. So "every field is reachable" = the page scrolls until that last control is in view,
 * and Save Changes is still there at the top afterwards.
 */
test('TC106 - Verify the Edit Session form scrolls to reveal every field down to Save Changes', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    await expect(courses.saveChangesButton()).toBeInViewport();

    const last = courses.deleteSessionRecordsLink();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    await expect(courses.teachingMethodOption('Group Discussion (TLM6)')).toBeVisible();

    await courses.saveChangesButton().scrollIntoViewIfNeeded();
    await expect(courses.saveChangesButton()).toBeInViewport();
  });
});
