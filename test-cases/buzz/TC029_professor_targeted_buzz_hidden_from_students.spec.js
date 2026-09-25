// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC029 — "Login as Student, check if buzz Assigned to
 * Professor is visible" — interpreted as: a Professor creates a Professor-targeted Buzz, and
 * that post should NOT be visible when browsing as a Student.
 * Precondition: none.
 * Steps: 1. As Professor, create a Buzz targeted at "Professor". 2. As Student, check the
 * feed.
 * Expected result: not specified — inferred: the Professor-targeted post is NOT visible to a
 * Student account.
 */
test('TC029 - Verify a Professor-targeted Buzz is NOT visible to a Student', async ({ browser }) => {
  const professorContext = await browser.newContext();
  const professorPage = await professorContext.newPage();

  await loginAsProfessor(professorPage);

  const marker = `QA Test TC029 - professor-targeted ${Date.now()} (safe to delete)`;
  const professorBuzz = new BuzzPage(professorPage);
  await professorBuzz.createBuzzButton.click();
  const createPage = new CreateBuzzPage(professorPage);
  await createPage.fillText(marker);
  await createPage.publishWithRecipientType('Professor');

  await expect(professorPage.getByText(marker)).toBeVisible({ timeout: 15000 });
  try {

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await loginAsStudent(studentPage);

  // Absence only means something once the student's feed has actually loaded.
  await expect(new BuzzPage(studentPage).feedCards().first()).toBeVisible({ timeout: 15000 });
  await expect(studentPage.getByText(marker)).not.toBeVisible();
  await studentContext.close();
  } finally {
    await professorBuzz.cleanupPost(marker);
    await professorContext.close();
  }
});
