// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: clicking "Select All" checks all four Session Type checkboxes (Lecture,
 * Tutorial, Practical, Remedial Class) together. */
test('TC010 - Verify "Select All" checks every Session Type checkbox', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  for (const name of ['Lecture', 'Tutorial', 'Practical', 'Remedial Class']) {
    await expect(reports.checkbox(name)).not.toBeChecked();
  }

  await reports.toggleCheckbox('Select All');

  for (const name of ['Lecture', 'Tutorial', 'Practical', 'Remedial Class']) {
    await expect(reports.checkbox(name)).toBeChecked();
  }
});
