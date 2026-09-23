// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC010 - Verify the Filters dialog\'s Session Type checkbox narrows the session list', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const practicalCard = courses.cardByText('Practical').first();
  const lectureCard = courses.cardByText('Lecture').first();
  await expect(practicalCard).toBeVisible();
  await expect(lectureCard).toBeVisible();

  await courses.openFilters();
  await courses.filterOption('Practical').click();
  await courses.filtersApplyButton().click();

  await expect(practicalCard).toBeVisible();
  await expect(lectureCard).toBeHidden();
});
