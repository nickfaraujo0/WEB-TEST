// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC059 —
 * Verify "Add students" offers Program, Year and Division filters.
 *
 * Confirmed live 2026-09-29: the student picker sits inline in the dialog with Program, Year and Division
 * selectors, a "Search Students by Name or Roll No" box and the matching students.
 */
test('TC059 - Verify "Add students" offers Program, Year and Division filters', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  await dialog.getByText('Add students', { exact: true }).click();
  for (const label of ['Program', 'Year', 'Division']) {
    await expect(dialog.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(dialog.getByPlaceholder('Search Students by Name or Roll No')).toBeVisible();
  await tabs.modalClose('Check In On-Duty Students').click();
});
