// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, fillCommonFilters } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: once Program, Semester (and Academic Year) are all chosen, Division becomes
 * a real, clickable Select whose only real option for this combination is "All Divisions"
 * (this Program/Semester/Academic Year combo has no divisions of its own, confirmed live). */
test('TC007 - Verify Division becomes selectable and offers "All Divisions" once filled in', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await fillCommonFilters(reports);
  await reports.openSelect('Division');
  await expect(page.locator('.ant-select-item-option', { hasText: 'All Divisions' }).first()).toBeVisible();
  await reports.chooseOption('All Divisions');
  await expect(reports.selectTrigger('Division')).toHaveText(/All Divisions/);
});
