// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC012 — Verify a Student gets no Edit/Delete options on
 * a Buzz.
 * Precondition: a Buzz authored by a Professor exists; a Student account is available.
 * Steps: 1. Sign in as a Professor and publish. 2. Sign in as a Student. 3. Locate that post.
 * Expected: the Student sees no "..." menu on it.
 *
 * Unblocks the mobile suite's TC012 skip (see tests/appium/Hive/Buzz/summary.md, "Second
 * account needed") — the second account it names as the fix (HIVE_STUDENT_EMAIL) is already
 * available to this suite, so this is a real two-account test rather than a skip.
 */
test('TC012 - Verify a Student has no Edit/Delete options on a Buzz', async ({ page, browser }) => {
  const marker = `Buzz-TC012 student-visibility-probe ${Date.now()}`;

  const professorPage = new LoginPage(page);
  await professorPage.goto();
  await professorPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const professorBuzz = new BuzzPage(page);
  await professorBuzz.openCreateBuzz();
  await professorBuzz.composeAndPublish(marker);
  await expect(professorBuzz.cardByText(marker)).toBeVisible({ timeout: 10000 });

  // A separate browser context: the Professor's session must not be disturbed by signing out.
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  const studentLogin = new LoginPage(studentPage);
  await studentLogin.goto();
  await studentLogin.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
  await expect(studentPage).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const studentBuzz = new BuzzPage(studentPage);
  const card = studentBuzz.cardByText(marker);
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(studentBuzz.cardMenuTrigger(card)).toHaveCount(0);

  await studentContext.close();

  // Clean up the marker post as the Professor.
  await page.reload();
  const cleanupCard = professorBuzz.cardByText(marker);
  await expect(cleanupCard).toBeVisible({ timeout: 10000 });
  await professorBuzz.deleteCard(cleanupCard);
});
