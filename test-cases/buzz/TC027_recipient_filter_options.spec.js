// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC027 — Verify that filter options appear under the
 * Student/Professor recipient tabs on the Select Recipients step.
 * Precondition: on Select Recipients step.
 * Steps: 1. Click "Student", check filters. 2. Click "Professor", check filters.
 * Expected result: not specified — inferred: each tab reveals its own set of toggleable
 * filters.
 *
 * Confirmed live: the two tabs are asymmetric. Student shows 3 filters — Department,
 * Programs, Year of study. Professor shows only 1 — Department. This matches the existing
 * Appium/mobile suite's documented finding (buzz-reference.md: "Faculty: 1 real toggle —
 * Departments only. No Programs/Year of Study"), independently re-confirmed here on web.
 */
test('TC027 - Verify Student shows 3 filters and Professor shows only 1', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fillText('TC027 filter-options probe');
  await createPage.goToRecipients();

  await createPage.recipientTypeButton('Student').click();
  await expect(page.locator('.ant-collapse-header', { hasText: 'Department' })).toBeVisible();
  await expect(page.locator('.ant-collapse-header', { hasText: 'Programs' })).toBeVisible();
  await expect(page.locator('.ant-collapse-header', { hasText: 'Year of study' })).toBeVisible();

  await createPage.recipientTypeButton('Professor').click();
  await expect(page.locator('.ant-collapse-header', { hasText: 'Department' })).toBeVisible();
  await expect(page.locator('.ant-collapse-header', { hasText: 'Programs' })).toHaveCount(0);
  await expect(page.locator('.ant-collapse-header', { hasText: 'Year of study' })).toHaveCount(0);
});
