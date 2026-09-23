// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live via className: the Student's Semester control is a two-pill Even/Odd toggle
 * (not a dropdown), mutually exclusive, defaulting to "Odd" for this account on 2025-26. */
test('TC028 - Verify the Student\'s Semester Even/Odd pills are mutually exclusive', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAttendance();

  expect(await reports.isStudentSemesterSelected('Odd')).toBe(true);
  expect(await reports.isStudentSemesterSelected('Even')).toBe(false);

  await reports.studentSemesterButton('Even').click();

  expect(await reports.isStudentSemesterSelected('Even')).toBe(true);
  expect(await reports.isStudentSemesterSelected('Odd')).toBe(false);
});
