// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC061 —
 * Verify the event type pills (Cultural / Sports / Technical) allow one choice at a time.
 *
 * Confirmed live 2026-09-29: the selected pill turns bg-subtleBlue; picking another deselects the first.
 */
test('TC061 - Verify the event type pills (Cultural / Sports / Technical) allow one choice at a time', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.onDutyButton().click();
  const dialog = tabs.onDutyDialog();
  await expect(dialog).toBeVisible();
  await tabs.eventTypePill('Cultural').click();
  expect(await tabs.isEventTypeSelected('Cultural')).toBe(true);
  await tabs.eventTypePill('Sports').click();
  await expect.poll(() => tabs.isEventTypeSelected('Sports')).toBe(true);
  expect(await tabs.isEventTypeSelected('Cultural')).toBe(false);
  expect(await tabs.isEventTypeSelected('Technical')).toBe(false);
  await tabs.modalClose('Check In On-Duty Students').click();
});
