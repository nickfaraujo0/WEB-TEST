// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './courses-helpers.js';

/**
 * Confirmed live: the student's own attended session shows a status badge on its card in
 * place of the professor's Take Attendance / Completed action row. The badge renders visually
 * as "PRESENT" (all caps) via CSS `text-transform`, but a real run's accessibility snapshot
 * showed the actual DOM text is "Present" — `getByText('PRESENT')` never matches it.
 */
test('TC050 - Verify a student\'s session card shows a status badge instead of professor actions', async ({ page }) => {
  await loginAs(page, ...STUDENT);
  await page.getByText('Courses', { exact: true }).click();
  await page.getByText('Div A', { exact: true }).click();
  await expect(page.getByText('Schedule/Lesson Plan', { exact: true })).toBeVisible({ timeout: 20000 });

  await expect(page.getByText('Present', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Take Attendance', { exact: true })).toHaveCount(0);
});
