// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC030 — Verify that the filter toggle switches under
 * the Student/Professor recipient tabs can be turned on and off.
 * Precondition: on Select Recipients step, a recipient tab selected.
 * Steps: 1. Toggle a filter on. 2. Toggle it off.
 * Expected result: not specified — inferred: the switch's checked state flips each click.
 *
 * Minor real finding, confirmed live via DOM inspection: the switch's own computed style is
 * fully interactive (pointer-events: auto, opacity: 1, not disabled), but its containing
 * .ant-collapse-header carries aria-disabled="true" (from antd's Collapse "no-arrow, not
 * collapsible" styling, reused here just to hold the label+switch row). A sighted mouse user
 * can click it fine, but Playwright's strict actionability check — and any real
 * assistive-tech user relying on aria-disabled — is told the control is disabled when it
 * isn't. { force: true } bypasses that here since we're testing the actual (mouse-driven)
 * behavior, not the accessibility gap itself.
 */
test('TC030 - Verify a recipient filter toggle can be turned on and off', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fillText('TC030 toggle probe');
  await createPage.goToRecipients();
  await createPage.recipientTypeButton('Student').click();

  const departmentToggle = createPage.recipientToggle('Department');
  await expect(departmentToggle).toHaveAttribute('aria-checked', 'false');

  await departmentToggle.click({ force: true });
  await expect(departmentToggle).toHaveAttribute('aria-checked', 'true');

  await departmentToggle.click({ force: true });
  await expect(departmentToggle).toHaveAttribute('aria-checked', 'false');
});
