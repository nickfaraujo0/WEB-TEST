// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './courses-helpers.js';

test('TC049 - Verify the student has no Divisions sidebar, Add Session, or Edit Schedule', async ({ page }) => {
  await loginAs(page, ...STUDENT);
  await page.getByText('Courses', { exact: true }).click();
  await page.getByText('Div A', { exact: true }).click();
  await expect(page.getByText('Schedule/Lesson Plan', { exact: true })).toBeVisible({ timeout: 20000 });

  await expect(page.getByText('Divisions', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Add Session', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Edit Schedule', { exact: true })).toHaveCount(0);
});
