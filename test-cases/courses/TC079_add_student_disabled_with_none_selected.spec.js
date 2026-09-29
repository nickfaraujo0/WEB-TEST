// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC079 —
 * Verify "Add Student" stays disabled while 0 students are selected.
 *
 * Closed without adding anyone.
 */
test('TC079 - Verify "Add Student" stays disabled while 0 students are selected', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Students');
  await tabs.addStudentsButton().click();
  const dialog = tabs.addStudentsDialog(DSA_ASSESSMENT.division);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('0 Students Selected', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Add Student', exact: true })).toBeDisabled();
  await tabs.modalClose(`Add Students to ${DSA_ASSESSMENT.division}`).click();
});
