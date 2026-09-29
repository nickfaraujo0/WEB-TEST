// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC062 —
 * Verify Next stays disabled until students, date, event type and event name are filled.
 *
 * Confirmed live 2026-09-29: Next is a real disabled <button> showing "0 selected". Filling only the event
 * type and name (no students, no date) must keep it disabled. Completing every field is not
 * automated — Next leads to marking real students on-duty.
 */
test('TC062 - Verify Next stays disabled until students, date, event type and event name are filled', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  await expect(tabs.onDutyNext()).toBeDisabled();
  await expect(dialog.getByText('0 selected', { exact: true })).toBeVisible();

  await tabs.eventTypePill('Technical').click();
  await expect(tabs.onDutyNext()).toBeDisabled();
  await tabs.onDutyEventName().fill('QA automation check');
  await expect(tabs.onDutyNext()).toBeDisabled();
  await tabs.modalClose('Check In On-Duty Students').click();
});
