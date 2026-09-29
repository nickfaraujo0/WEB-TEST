// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Hive Test Cases Playwright (master), sheet "Courses – Schedule & Sessions (Web)", TC115 —
 * Verify the session list scrolls to show every session in the month.
 * (From the Courses sheet, Schedule TC002.)
 *
 * Confirmed live 2026-09-29: Mechanics of Solids / Div A has many sessions a month, more than
 * fit on screen. This checks the list really scrolls — the month's last card moves up into view
 * — and "Load Next Month" can be reached below it.
 */
test('TC115 - Verify the session list scrolls to show every session in the month', async ({ page }) => {
  await loginAsProfessor(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);

  const cards = courses.sessionCards;
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  expect(await cards.count()).toBeGreaterThan(3);

  // The scrolling happens in an inner container, not the window (a real run showed
  // window.scrollY staying 0), so measure the card's own position instead: it must move up.
  const last = cards.last();
  await expect(last).not.toBeInViewport();
  const before = (await last.boundingBox())?.y ?? 0;
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  const after = (await last.boundingBox())?.y ?? 0;
  expect(after).toBeLessThan(before);

  await courses.loadNextMonthButton.scrollIntoViewIfNeeded();
  await expect(courses.loadNextMonthButton).toBeInViewport();
});
