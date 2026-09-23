// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Confirmed live: the Faculty checklist in Filters lists this course's own faculty
 * ("Nilesh Sutttar" — note the real data's own typo, three t's — and "Nolan Dmello"), not a
 * global list. Neither has a session in the currently-loaded months though, so narrowing is
 * checked against a real, currently-visible faculty-less session ("Mon, 7 Sep") instead —
 * an earlier version asserted against a "Nilesh Sutttar" session that doesn't exist here,
 * which passed regardless of whether filtering worked at all.
 */
test('TC011 - Verify the Filters dialog\'s Faculty checkbox narrows the session list', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const nolanCard = courses.cardByText('Nolan Dmello').first();
  const noFacultyCard = courses.cardByText('Mon, 7 Sep').first();
  await expect(nolanCard).toBeVisible();
  await expect(noFacultyCard).toBeVisible();

  await courses.openFilters();
  await courses.filterOption('Nolan Dmello').click();
  await courses.filtersApplyButton().click();

  await expect(nolanCard).toBeVisible();
  await expect(noFacultyCard).toBeHidden();
});
