// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, fillCommonFilters, submitAndExpectSuccess } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: clicking "Okay" on the success modal simply closes it — the underlying form
 * keeps every filter the user had set (Program/Semester/Academic Year, checked Session Types),
 * it is not reset back to empty. Uses `lastEnabledCalendarDay()` for both dates — see TC017's
 * own comment on why an early hardcoded day number is unreliable (disabled once in the past).
 */
test('TC018 - Verify closing the success modal via Okay keeps the form filters intact', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await fillCommonFilters(reports);
  await reports.openDatePicker('Start Date');
  await reports.lastEnabledCalendarDay().click();
  await reports.openDatePicker('End Date');
  await reports.lastEnabledCalendarDay().click();
  await reports.toggleCheckbox('Select All');

  await reports.downloadReportButton().click();
  await submitAndExpectSuccess(reports, page);

  await expect(reports.selectTrigger('Program')).toContainText('Computer Science');
  await expect(reports.checkbox('Lecture')).toBeChecked();
});
