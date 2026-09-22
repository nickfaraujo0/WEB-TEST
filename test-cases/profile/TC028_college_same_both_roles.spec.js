// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs, STUDENT } from './profile-helpers.js';

/** Web-only. Confirmed live: the professor and student accounts belong to the same college, so College Name matches. */
test('TC028 - Verify College Name is the same for professor and student', async ({ browser }) => {
  const profCtx = await browser.newContext();
  const profPage = await profCtx.newPage();
  await loginAs(profPage);
  const prof = new ProfilePage(profPage);
  await prof.goto();
  const profCollege = await prof.college.inputValue();

  const studCtx = await browser.newContext();
  const studPage = await studCtx.newPage();
  await loginAs(studPage, ...STUDENT);
  const stud = new ProfilePage(studPage);
  await stud.goto();

  expect(profCollege).not.toBe('');
  await expect(stud.college).toHaveValue(profCollege);
  await profCtx.close();
  await studCtx.close();
});
