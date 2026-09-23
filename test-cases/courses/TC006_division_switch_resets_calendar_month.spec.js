// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed live: loading October into view, then switching away and back to the same
 * division, drops October again — the calendar always re-opens on the default current month. */
test('TC006 - Verify switching divisions resets the calendar back to the default month', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await courses.loadNextMonthButton.click();
  const octoberSession = page.getByText('Mon, 12 Oct', { exact: false });
  await expect(octoberSession).toBeVisible({ timeout: 15000 });

  await courses.divisionTab('Assessment test').click();
  await courses.divisionTab(DSA.division).click();

  await expect(octoberSession).toBeHidden();
});
