// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC015 — Verify copy/paste works on Create Buzz.
 * Precondition: logged in, Create Buzz composer open, text already typed.
 * Steps: 1. Select the text. 2. Copy it. 3. Clear the field. 4. Paste.
 * Expected: the pasted text matches the original exactly — folds in the mobile suite's
 * TC016 ("pasted content unchanged") as the same assertion, since both share one mechanism.
 *
 * SKIPPED on the mobile suite: no gesture in that harness could raise a Copy control. Web has
 * no such limit — `ControlOrMeta+C` / `ControlOrMeta+V` drive the browser's real clipboard,
 * unblocking both TC015 and TC016 here.
 */
test('TC015 - Verify copy/paste on Create Buzz', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  await buzzPage.openCreateBuzz();

  const original = 'TC015 copy-paste probe 12345';
  const editor = buzzPage.composerEditor();
  await editor.click();
  await editor.pressSequentially(original);
  await expect(editor).toHaveText(original);

  await editor.selectText();
  await page.keyboard.press('ControlOrMeta+C');

  await editor.selectText();
  await page.keyboard.press('Delete');
  await expect(editor).toHaveText('');

  await page.keyboard.press('ControlOrMeta+V');

  await expect(editor).toHaveText(original);
});
