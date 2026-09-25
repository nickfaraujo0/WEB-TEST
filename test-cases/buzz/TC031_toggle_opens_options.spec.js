// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC031 — Enabling the toggle should open the list of
 * options to choose.
 * Precondition: on Create Buzz page. Steps: Next -> Choose Recipients -> Student/Professor ->
 * turn a toggle on -> check the list of options populates.
 * Expected result: not specified — inferred: each enabled filter expands a list of selectable
 * options.
 *
 * Confirmed live: the options are pill-shaped buttons inside the toggle's antd Collapse panel
 * (multi-select — clicking one marks it selected). Department lists ~30 entries.
 */
test('TC031a - Student: each toggle expands its option list', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC031 toggle options probe');
  await create.goToRecipients();
  await create.recipientTypeButton('Student').click();

  for (const header of ['Department', 'Programs', 'Year of study']) {
    await expect(create.recipientOptions(header)).toHaveCount(0);
    await create.recipientToggle(header).click({ force: true });
    await expect(create.recipientOptions(header).first()).toBeVisible({ timeout: 10000 });
    expect(await create.recipientOptions(header).count()).toBeGreaterThan(0);
    await create.recipientToggle(header).click({ force: true });
  }
});

test('TC031b - Professor: Department toggle expands its option list', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC031 toggle options probe (professor)');
  await create.goToRecipients();
  await create.recipientTypeButton('Professor').click();

  await create.recipientToggle('Department').click({ force: true });
  await expect(create.recipientOptions('Department').first()).toBeVisible({ timeout: 10000 });
  expect(await create.recipientOptions('Department').count()).toBeGreaterThan(5);
});
