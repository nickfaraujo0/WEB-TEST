// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC028 — "Login as Professor, check if buzz Assigned to
 * Students is visible" (spreadsheet wording is self-referential about who's logged in vs.
 * who the post targets — interpreted as: a Professor creates a Student-targeted Buzz, and
 * that post is later visible when browsing as a Student).
 * Precondition: none.
 * Steps: 1. As Professor, create a Buzz targeted at "Student". 2. As Student, check the feed.
 * Expected result: not specified — inferred: the Student-targeted post is visible to a
 * Student account.
 *
 * Uses two separate browser contexts (one per role) rather than logging out/in on one page,
 * so each session's own cookies/IndexedDB auth state stay isolated.
 */
test('TC028 - Verify a Student-targeted Buzz is visible to a Student', async ({ browser }) => {
  const professorContext = await browser.newContext();
  const professorPage = await professorContext.newPage();

  await loginAsProfessor(professorPage);

  const marker = `QA Test TC028 - student-targeted ${Date.now()} (safe to delete)`;
  const professorBuzz = new BuzzPage(professorPage);
  await professorBuzz.createBuzzButton.click();
  const createPage = new CreateBuzzPage(professorPage);
  await createPage.fillText(marker);
  await createPage.publishWithRecipientType('Student');

  await expect(professorPage.getByText(marker)).toBeVisible({ timeout: 15000 });
  try {

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await loginAsStudent(studentPage);

  await expect(studentPage.getByText(marker)).toBeVisible({ timeout: 15000 });
  await studentContext.close();
  } finally {
    await professorBuzz.cleanupPost(marker);
    await professorContext.close();
  }
});
