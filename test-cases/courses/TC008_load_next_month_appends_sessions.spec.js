// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC008 - Verify Load Next Month appends further sessions without dropping earlier ones', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await expect(courses.cardByText('Fri, 4 Sep').first()).toBeVisible();

  await courses.loadNextMonthButton.click();

  await expect(courses.cardByText('Fri, 4 Sep').first()).toBeVisible();
  await expect(page.getByText('Mon, 12 Oct', { exact: false })).toBeVisible({ timeout: 15000 });
});
