// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Confirmed bug live: reopening Edit Session for a session that shows "All Participants" on
 * its card still opens with every B1-B4 batch unchecked — participants are never prefilled.
 * The selected-state class (`border-brandGreen`/`bg-subtleBlue`) is confirmed live on this
 * form's sibling Session Type control, not independently re-confirmed per batch button, since
 * both are the same shared pill component.
 */
test('TC027 - Verify Edit Session does not prefill Participants, even for "All Participants" (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('All Participants').first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });

  for (const batch of ['B1', 'B2', 'B3', 'B4']) {
    await expect(courses.participantBatchField(batch)).not.toHaveClass(/bg-subtleBlue/);
  }
});
