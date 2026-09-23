// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './courses-helpers.js';
import { CoursesPage } from './courses-page.js';

/**
 * Confirmed live: the "..." (`.ant-dropdown-trigger`) that opens Edit/Reschedule/Delete on
 * the professor's card is not rendered at all on the student's copy of the same card.
 * `.ant-dropdown-trigger` alone also matches the header's own account-menu avatar (confirmed
 * by a real run: it resolved to 2 elements on the student's page), so this checks inside a
 * session card specifically, not the whole page.
 */
test('TC051 - Verify a student cannot reach Edit/Reschedule/Delete Session (no "..." menu)', async ({ page }) => {
  await loginAs(page, ...STUDENT);
  await page.getByText('Courses', { exact: true }).click();
  await page.getByText('Div A', { exact: true }).click();
  await expect(page.getByText('Schedule/Lesson Plan', { exact: true })).toBeVisible({ timeout: 20000 });

  const courses = new CoursesPage(page);
  const card = courses.cardByText('Untitled session').first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await expect(courses.cardMenuTrigger(card)).toHaveCount(0);
});
