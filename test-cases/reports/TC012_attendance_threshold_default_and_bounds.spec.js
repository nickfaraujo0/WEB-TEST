// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live via outerHTML: the Attendance Threshold is a real antd InputNumber
 * (`role="spinbutton"`) defaulting to "100%", with `aria-valuemin="10"`, `aria-valuemax="100"`,
 * and `step="5"`. */
test('TC012 - Verify Attendance Threshold defaults to 100% with min 10 / max 100 / step 5', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  const input = reports.thresholdInput();
  await expect(input).toHaveValue('100%');
  await expect(input).toHaveAttribute('aria-valuemin', '10');
  await expect(input).toHaveAttribute('aria-valuemax', '100');
  await expect(input).toHaveAttribute('step', '5');
});
