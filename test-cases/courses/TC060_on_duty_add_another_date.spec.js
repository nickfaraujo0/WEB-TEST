// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC060 —
 * Verify "Add Another Date" adds another check-in date.
 *
 * Confirmed live 2026-09-29: each date row has a "Select date" input; "+ Add Another Date" adds a second row.
 */
test('TC060 - Verify "Add Another Date" adds another check-in date', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  await expect(tabs.onDutyDateInputs()).toHaveCount(1);
  await dialog.getByText('Add Another Date', { exact: true }).click();
  await expect(tabs.onDutyDateInputs()).toHaveCount(2);
  await tabs.modalClose('Check In On-Duty Students').click();
});
