// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC014 — Verify you can type on Create Buzz.
 * Precondition: logged in, Create Buzz composer open.
 * Steps: Type a message into the composer.
 * Expected: the typed text appears in full.
 *
 * The mobile suite hit silent input truncation here (ADB's `input text` outruns the
 * rich-text editor) and had to type in 8-character chunks. Confirmed live: typing on web hits
 * no such limit — a real keystroke-by-keystroke type lands intact in one pass, a genuine
 * strength of testing this editor through a real browser instead of ADB.
 */
test('TC014 - Verify typing on Create Buzz', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.openCreateBuzz();

  const message = 'TC014 typing probe — the quick brown fox jumps over the lazy dog.';
  await buzzPage.composerEditor().click();
  await buzzPage.composerEditor().pressSequentially(message);

  await expect(buzzPage.composerEditor()).toHaveText(message);
  await expect(buzzPage.wizardNextButton()).toBeEnabled();
});
