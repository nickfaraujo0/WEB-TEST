// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC013 - Verify a session card shows date/time, duration, batches, title, type and faculty', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const card = courses.cardByText('B5, B6').first();

  await expect(card.getByText('Fri, 4 Sep at 11:35 AM', { exact: true })).toBeVisible();
  await expect(card.getByText('3hr', { exact: true })).toBeVisible();
  await expect(card.getByText('B5, B6, B8, B7, B3, B4, B2, B1', { exact: true })).toBeVisible();
  await expect(card.getByText('Untitled session', { exact: true })).toBeVisible();
  await expect(card.getByText('Practical • Nolan Dmello', { exact: true })).toBeVisible();
});
