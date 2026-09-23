// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC022 - Verify closing New Session without creating leaves no new session behind', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.sessionCards.first().waitFor({ state: 'visible', timeout: 15000 });
  const before = await courses.sessionCards.count();

  await courses.addSessionButton.click();
  await courses.topicsCoveredEditor().click();
  await courses.topicsCoveredEditor().fill('TC022 discarded draft');
  await page.keyboard.press('Escape');

  await expect(courses.newSessionDialog()).toBeHidden();
  await expect(courses.sessionCards).toHaveCount(before);
});
