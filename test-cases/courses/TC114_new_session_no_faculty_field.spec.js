// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC114 —
 * Verify the Faculty taking the session can be chosen when creating it.
 * (From the Courses sheet, Schedule TC035 — possible on the mobile app.)
 *
 * GAP, confirmed live 2026-09-29: web's New Session dialog has no Faculty field at all — its
 * fields are Session Date, Start Time, Duration, Session Type, Batches, Select Unit and Topics
 * Covered. Faculty can only be changed afterwards, in Edit Session (a "Faculty" select). This
 * asserts the gap and passes while it stands; if a Faculty field is added, it fails and should
 * be rewritten to choose one and check the created card. Nothing is created (Cancel).
 */
test('TC114 - Verify the Faculty taking the session can be chosen when creating it (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await courses.addSessionButton.click();
  const dialog = courses.newSessionDialog();
  await expect(dialog).toBeVisible();
  for (const label of ['Session Date', 'Start Time', 'Duration', 'Session Type', 'Batches', 'Select Unit', 'Topics Covered']) {
    await expect(dialog.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(dialog.getByText('Faculty', { exact: true })).toHaveCount(0);

  await courses.cancelNewSessionButton().click();
  await expect(dialog).toBeHidden();
});
