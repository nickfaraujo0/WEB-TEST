// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC017 — Verify that the user is able to format the
 * text (Bold, Italic, Underline, Link, ordered/bullet list) on "Create a buzz" page.
 * Precondition: on Create Buzz page, some text typed.
 * Steps: 1. Select the text. 2. Apply formatting from the toolbar. 3. Check if formatting is
 * applied.
 * Expected result: not specified — inferred: the selected text (or current line, for lists)
 * takes on the corresponding HTML formatting.
 *
 * Each sub-test starts from a clean modal and selects text via a real triple-click (native
 * browser text selection), not Ctrl+A — a manual-tool exploration earlier found Ctrl+A-based
 * selection didn't survive the toolbar button's mousedown handler and produced an empty,
 * cursor-only <strong> tag instead of wrapping the actual text. Triple-click is the more
 * standard way a real user would select a line of text in a rich-text editor.
 */

/** Opens Create Buzz, types text, and returns a triple-click-selected editor locator. */
async function openWithSelectedText(page, text) {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.textEditor.click();
  await createPage.textEditor.pressSequentially(text);
  await createPage.textEditor.click({ clickCount: 3 }); // select the whole line
  return createPage;
}

test('TC017a - Bold formatting applies to selected text', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'Bold me');
  await createPage.boldButton.click();
  await expect(createPage.textEditor.locator('strong')).toHaveText('Bold me');
});

test('TC017b - Italic formatting applies to selected text', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'Italicize me');
  await createPage.italicButton.click();
  await expect(createPage.textEditor.locator('em')).toHaveText('Italicize me');
});

test('TC017c - Underline formatting applies to selected text', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'Underline me');
  await createPage.underlineButton.click();
  await expect(createPage.textEditor.locator('u')).toHaveText('Underline me');
});

test('TC017d - Ordered list formatting applies to the current line', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'List item one');
  await createPage.orderedListButton.click();
  await expect(createPage.textEditor.locator('ol li')).toHaveText('List item one');
});

test('TC017e - Bullet list formatting applies to the current line', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'Bullet item one');
  await createPage.bulletListButton.click();
  await expect(createPage.textEditor.locator('ul li')).toHaveText('Bullet item one');
});

test('TC017f - Link button on selected text opens an editable link tooltip', async ({ page }) => {
  const createPage = await openWithSelectedText(page, 'https://example.com');
  await createPage.linkButton.click();

  // Quill's standard "Enter link:" tooltip, pre-filled with the selected text as the URL.
  const tooltip = page.locator('.ql-tooltip');
  await expect(tooltip).toBeVisible();
  const urlInput = tooltip.getByRole('textbox');
  await expect(urlInput).toHaveValue('https://example.com');

  // Pressing Enter in Quill's link input submits it — more reliable than clicking the
  // "Save" text, which is a plain (non-button) span that occasionally isn't stable/clickable
  // during the tooltip's own open transition.
  await urlInput.press('Enter');

  const link = createPage.textEditor.locator('a');
  await expect(link).toHaveAttribute('href', 'https://example.com');
  await expect(link).toHaveText('https://example.com');
});
