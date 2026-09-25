// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Next to this spec, so it resolves the same whichever folder Playwright is started from.
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC020 — Verify that the user is able to attach a file
 * on "Create a buzz" page.
 * Precondition: on Create Buzz page.
 * Steps: 1. Click on the file/folder icon. 2. Select a file. 3. Check if it's attached.
 * Expected result: not specified — inferred: the chosen file appears listed in the composer.
 *
 * Confirmed live: the second footer icon opens an "Attach Files" modal (same component used
 * by the Opportunities suite's file upload, see tests/opportunities/TC013) advertising
 * "Supported Files: PDF" — a <input type="file" multiple> is already present in that modal's
 * DOM (no further click needed to reveal it, unlike Opportunities' "Click to Browse" text).
 */
test('TC020 - Verify a file can be attached to a Buzz post', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fileAttachIcon.click();

  await expect(page.getByText('Attach Files')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'small-test.pdf'));

  await createPage.attachFilesUploadButton.click();

  // Attached = back on Step 1 with the file as a chip (the server renames "-" to "_").
  await expect(createPage.attachedFileChip.last()).toContainText('small_test.pdf', { timeout: 10000 });
  await expect(page.getByText('Step 1 / 4')).toBeVisible();
});
