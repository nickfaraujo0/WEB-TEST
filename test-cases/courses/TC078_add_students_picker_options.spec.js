// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC078 —
 * Verify "Add Students" opens the picker with Program, Year, Division and search options.
 *
 * Confirmed live 2026-09-29. Closed without adding anyone.
 */
test('TC078 - Verify "Add Students" opens the picker with Program, Year, Division and search options', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Students');
  await tabs.addStudentsButton().click();
  const dialog = tabs.addStudentsDialog(DSA_ASSESSMENT.division);
  await expect(dialog).toBeVisible();
  for (const text of ['Program', 'Year', 'Division', 'Search All Departments', 'Expand Search Across Hive', '0 Students Selected', 'Add Student']) {
    await expect(dialog.getByText(text, { exact: true })).toBeVisible();
  }
  await tabs.modalClose(`Add Students to ${DSA_ASSESSMENT.division}`).click();
  await expect(dialog).toBeHidden();
});
