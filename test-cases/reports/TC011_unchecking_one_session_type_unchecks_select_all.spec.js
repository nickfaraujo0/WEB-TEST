// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: with all four Session Types checked via "Select All", unchecking any single
 * one (e.g. Tutorial) leaves the other three checked but auto-unchecks "Select All" itself —
 * a real indeterminate-style behavior, not an all-or-nothing group. */
test('TC011 - Verify unchecking one Session Type auto-unchecks "Select All"', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.toggleCheckbox('Select All');
  await reports.toggleCheckbox('Tutorial');

  await expect(reports.checkbox('Select All')).not.toBeChecked();
  await expect(reports.checkbox('Tutorial')).not.toBeChecked();
  await expect(reports.checkbox('Lecture')).toBeChecked();
  await expect(reports.checkbox('Practical')).toBeChecked();
  await expect(reports.checkbox('Remedial Class')).toBeChecked();
});
