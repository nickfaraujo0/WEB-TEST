// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC058 —
 * Verify "Check in On-Duty Students" opens the check-in dialog with all its sections.
 *
 * Confirmed live 2026-09-29. Nothing is submitted — the dialog is closed with its "+" (rotated ×) button.
 */
test('TC058 - Verify "Check in On-Duty Students" opens the check-in dialog with all its sections', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  for (const text of ['Add students', 'When should the students be marked on-duty?', 'Check-in for specific dates',
    'What type of event is the on-duty for?', "What's the event name?", '0 selected']) {
    await expect(dialog.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(tabs.onDutyNext()).toBeVisible();
  await tabs.modalClose('Check In On-Duty Students').click();
  await expect(dialog).toBeHidden();
});
