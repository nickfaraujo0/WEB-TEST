// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed bug: "Add Lesson Diary" renders in a dim/greyed style (`text-[#B9DCBF]`,
 * suggesting disabled) but is a plain clickable div with no disabled state — clicking it
 * opens the same Edit Session form as "..." > Edit Session. */
test('TC015 - Verify "Add Lesson Diary" is visually dim but fully clickable (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const card = courses.cardByText('Untitled session').filter({ hasText: 'Add Lesson Diary' }).first();

  await courses.addLessonDiaryLink(card).click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
});
