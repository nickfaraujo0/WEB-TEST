// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Confirmed live by a real run + follow-up manual check: "Clear all" is not "clear the
 * checkboxes, then still need Apply" — it clears the selection AND closes the dialog
 * immediately, in one action (confirmed via `document.querySelector('[role="dialog"]')`
 * returning null right after the click). A prior version of this test clicked Apply
 * afterward and timed out waiting for a button that no longer existed.
 *
 * A prior version also assumed a "Nilesh Sutttar" session was in the default view to prove the
 * Faculty filter had been cleared — a real run showed that's wrong: Nilesh Sutttar (note the
 * real data's own typo, three t's) is a valid faculty option in the Filters dialog, but has no
 * session in the currently-loaded months. Total card count before/after is a more reliable
 * "unfiltered again" signal.
 */
test('TC012 - Verify Filters\' "Clear all" resets Session Type and Faculty selections', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.sessionCards.first().waitFor({ state: 'visible', timeout: 15000 });
  const unfilteredCount = await courses.sessionCards.count();

  await courses.openFilters();
  await courses.filterOption('Practical').click();
  await courses.filterOption('Nolan Dmello').click();
  await courses.filtersApplyButton().click();
  await expect(courses.sessionCards).toHaveCount(1, { timeout: 15000 });

  await courses.openFilters();
  await courses.filtersClearAllButton().click();

  await expect(courses.filtersDialog()).toBeHidden();
  await expect(courses.sessionCards).toHaveCount(unfilteredCount, { timeout: 15000 });
});
