// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: switching Academic Year to "2024-25" leaves only the "Odd" semester pill
 * rendered at all (no "Even" button exists in the DOM for that combination) for this student
 * account — a real reflection of this student's actual enrollment/session data for that year,
 * not a generic bug. Switching back to "2025-26" restores both pills.
 */
test('TC029 - Verify choosing Academic Year 2024-25 leaves only the "Odd" semester option', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAttendance();

  await expect(reports.studentSemesterButton('Even')).toBeVisible();

  await reports.openSelect('Academic Year');
  await reports.chooseOption('2024-25');

  await expect(reports.studentSemesterButton('Odd')).toBeVisible();
  await expect(reports.studentSemesterButton('Even')).toHaveCount(0);
});
