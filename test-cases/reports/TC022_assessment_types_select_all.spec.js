// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

const ASSESSMENT_TYPES = [
  'EndSemester',
  'Internal Tests',
  'Class Test',
  'Tutorials',
  'Workshops',
  'Assignments',
  'Term Work',
  'Mini-Projects',
  'Practicals',
];

/** Confirmed live: the Assessment tab's own checkbox group has 9 types (a different set/count
 * from the Attendance tab's 4 Session Types), and "Select All" / individual-uncheck behave the
 * same way as Session Types (TC010/TC011). */
test('TC022 - Verify "Select All" checks all nine Assessment Types, and unchecking one un-selects "Select All"', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await reports.toggleCheckbox('Select All');
  for (const name of ASSESSMENT_TYPES) {
    await expect(reports.checkbox(name)).toBeChecked();
  }

  await reports.toggleCheckbox('Class Test');
  await expect(reports.checkbox('Select All')).not.toBeChecked();
  await expect(reports.checkbox('Class Test')).not.toBeChecked();
  await expect(reports.checkbox('EndSemester')).toBeChecked();
});
