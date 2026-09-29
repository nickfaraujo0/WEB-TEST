// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC084 —
 * Verify course Messages says Discussions are only on the mobile app (N/A on web).
 *
 * Confirmed live 2026-09-29 for both roles. The student is checked in a second browser context.
 */
test('TC084 - Verify course Messages says Discussions are only on the mobile app (N/A on web)', async ({ page, browser }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Messages');
  const notice = /^Discussions are currently available only on the Hive Mobile App \(iOS & Android\)$/;
  await expect(page.getByText(notice)).toBeVisible({ timeout: 20000 });

  const context = await browser.newContext();
  try {
    const student = await context.newPage();
    await loginAsStudent(student);
    const studentTabs = await openStudentCourse(student);
    await studentTabs.openSubTab('Messages');
    await expect(student.getByText(notice)).toBeVisible({ timeout: 20000 });
  } finally {
    await context.close();
  }
});
