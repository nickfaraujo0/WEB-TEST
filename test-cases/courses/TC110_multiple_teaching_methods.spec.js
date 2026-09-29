// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, openEditSession, withDisposableSession, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC110 —
 * Verify more than one Teaching/Learning Method can be selected at once.
 * (From the Courses sheet, Schedule TC026. TC030 only checks the list is never prefilled.)
 *
 * Confirmed live 2026-09-29: six real checkboxes — Chalk & Talk (TLM1), PPT (TLM2), Tutorial
 * (TLM3), Demonstration (TLM4), ICT (TLM5), Group Discussion (TLM6). Nothing is saved (the
 * throwaway session is deleted afterwards).
 */
test('TC110 - Verify more than one Teaching/Learning Method can be selected at once', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  await withDisposableSession(page, courses, async (card) => {
    await openEditSession(courses, card);
    const chalk = courses.teachingMethodOption('Chalk & Talk (TLM1)');
    const ppt = courses.teachingMethodOption('PPT (TLM2)');
    const ict = courses.teachingMethodOption('ICT (TLM5)');

    await chalk.check();
    await ppt.check();
    await ict.check();

    await expect(chalk).toBeChecked();
    await expect(ppt).toBeChecked();
    await expect(ict).toBeChecked();
    await expect(courses.teachingMethodOption('Tutorial (TLM3)')).not.toBeChecked();
  });
});
