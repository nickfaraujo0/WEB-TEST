// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, REPORT_FILTERS } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the Semester dropdown always offers "Semester 1" through "Semester 8" for
 * any given Program — this is a generic 1-8 list, not program-specific in its own values.
 *
 * Corrected from an earlier draft's assumption: Semester itself is DISABLED until Program is
 * selected (confirmed live via a real failed run's own accessibility snapshot showing
 * `combobox [disabled]` on Semester while Program was still empty, and via manual verification
 * that Semester becomes enabled the moment a Program is chosen). This test selects a Program
 * first for that reason — it was not needed to see the list's actual contents, only to unlock
 * the field at all.
 */
test('TC004 - Verify the Semester dropdown lists Semester 1 through Semester 8', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.selectField('Program', REPORT_FILTERS.program);
  await reports.openSelect('Semester');
  for (let i = 1; i <= 8; i++) {
    await expect(page.locator('.ant-select-item-option', { hasText: `Semester ${i}` }).first()).toBeVisible();
  }
});
