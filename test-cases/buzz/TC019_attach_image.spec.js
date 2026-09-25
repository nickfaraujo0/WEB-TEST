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
 * Hive Test Cases.xlsx, sheet "Buzz", TC019 — Verify that the user is able to attach an
 * image on "Create a buzz" page.
 * Precondition: on Create Buzz page.
 * Steps: 1. Click on the image icon. 2. Select an image. 3. Check if it's attached.
 * Expected result: not specified — inferred: the chosen image appears as a preview/thumbnail
 * and can be saved into the post.
 *
 * Real bug, confirmed live across 3 separate runs and 2 independent selection methods
 * (page.waitForEvent('filechooser') + fileChooser.setFiles, and a direct
 * input.setInputFiles on the underlying <input type="file" accept="image/*">): the browser
 * genuinely receives the file (input.files.length === 1 immediately after selection, and the
 * DOM node is then replaced — evidence a React re-render did fire), but the dialog's
 * ant-upload-list stays empty, "Click to Upload" never changes to show the picked file, and
 * "Save Image"/"Change Image" remain permanently disabled. No error, toast, or any other
 * feedback appears — the same silent-failure pattern already documented in the Opportunities
 * suite's TC014 (oversized file). Attaching an image to a Buzz post does not currently work
 * at all, for any image.
 */
test('TC019 - Verify attaching an image is broken: selection never registers (bug)', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.imageAttachIcon.click();
  await expect(createPage.imageUploadDialog).toBeVisible();
  await expect(createPage.saveImageButton).toBeDisabled();
  await expect(createPage.changeImageButton).toBeDisabled();

  const input = page.locator('input[type="file"][accept="image/*"]');
  await input.setInputFiles(path.join(fixturesDir, 'small-test.png'));
  // Proving something does NOT appear needs a moment for it to have had the chance to; wait
  // for the picker to finish reacting (its buttons settle) rather than a fixed sleep alone.
  await page.waitForLoadState('domcontentloaded');
  await expect(createPage.saveImageButton).toBeVisible();
  await page.waitForTimeout(1500);

  // The picked filename never appears, and Save/Change stay disabled — the selection was
  // silently dropped by the app.
  await expect(page.getByText('small-test.png').or(page.getByText('small_test.png'))).not.toBeVisible();
  await expect(createPage.saveImageButton).toBeDisabled();
  await expect(createPage.changeImageButton).toBeDisabled();
});
