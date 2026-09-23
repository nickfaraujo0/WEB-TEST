// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Web-only confirmed gap, matching the Android suite's confirmed absence (Courses TC003
 * comment): there is no control to jump straight to past or upcoming sessions — only
 * "Load Next Month", one month at a time. */
test('TC014 - Verify no "View Past Sessions" / "View Upcoming Sessions" control exists (gap)', async ({ page }) => {
  await loginAs(page);
  await openCourse(page, DSA.course, DSA.division);
  await expect(page.getByText('View Past Sessions', { exact: false })).toHaveCount(0);
  await expect(page.getByText('View Upcoming Sessions', { exact: false })).toHaveCount(0);
});
