// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC111 —
 * Verify whether Edit Session has a "Delete Record" button (mobile has one).
 * (From the Courses sheet, Schedule TC028.)
 *
 * Confirmed live 2026-09-29: yes — web has "Delete Session Records" at the bottom of Edit
 * Session, and it asks for confirmation (Delete / Cancel) first. This checks the control and its
 * confirm, then Cancels; actually deleting is covered by TC040 via the card's "..." menu.
 */
test('TC111 - Verify Edit Session has "Delete Session Records" with a Delete/Cancel confirmation', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    const link = courses.deleteSessionRecordsLink();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();

    await link.click();
    const confirm = courses.deleteRecordsConfirmDialog();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await expect(confirm.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await expect(confirm.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();

    await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(confirm).toBeHidden();
    await expect(courses.sessionDetailsHeading()).toBeVisible();
  });
});
