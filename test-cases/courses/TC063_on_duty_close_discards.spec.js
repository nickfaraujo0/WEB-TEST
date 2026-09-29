// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC063 —
 * Verify closing the dialog without completing it marks nobody on-duty.
 *
 * Fills some fields, closes the dialog, reopens it and checks nothing was kept. Completing a check-in is
 * not automated — it changes real attendance.
 */
test('TC063 - Verify closing the dialog without completing it marks nobody on-duty', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  await tabs.eventTypePill('Cultural').click();
  await tabs.onDutyEventName().fill('QA automation check');
  await tabs.modalClose('Check In On-Duty Students').click();
  await expect(dialog).toBeHidden();

  await tabs.onDutyButton().click();
  await expect(dialog).toBeVisible();
  await expect(tabs.onDutyEventName()).toHaveValue('');
  await expect(dialog.getByText('0 selected', { exact: true })).toBeVisible();
  await tabs.modalClose('Check In On-Duty Students').click();
});
