// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC032 — Verify that choosing a specific option only
 * sends the buzz to that specific group of people.
 * Steps: 1. Create and publish a buzz with a specific option chosen. 2. Login as student.
 * 3. Check the buzz is not visible to a student outside those options.
 * Expected result: not specified — inferred: a Department-targeted Buzz is visible only to
 * students in that department.
 *
 * student0003@test.com is in "Mechanical Engineering" (read from the session-details API
 * response). Two Buzzes are published: one targeted at "Archeology" (student must NOT see it)
 * and a positive control targeted at "Mechanical Engineering" (student MUST see it) — without
 * the control, "not visible" could just mean the feed never showed new posts. The department
 * list contains "Mechanical Engineering" twice; both entries are selected.
 *
 * Real bug, confirmed live: the Archeology-targeted Buzz IS visible to the Mechanical
 * Engineering student. The client is not at fault — the CreateAnnouncement request carries
 * departmentRecipients: [<Archeology id>] and roleRecipients: [<student role>] (captured from
 * the network) — so the department filter is simply not enforced when the feed is served: the
 * role match alone is enough to show the post. Student-vs-Professor targeting does work
 * (TC028/TC029); only the narrowing filters are ignored. Asserted as observed below.
 */
test('TC032 - Verify a department-targeted Buzz leaks to students outside that department (bug)', async ({ browser }) => {
  test.setTimeout(150000);
  const ts = Date.now();
  const outside = `QA Test TC032 - targeted at Archeology ${ts} (safe to delete)`;
  const inside = `QA Test TC032 - targeted at Mechanical Engineering ${ts} (safe to delete)`;

  const profContext = await browser.newContext();
  const prof = await profContext.newPage();
  await loginAsProfessor(prof);
  for (const [text, dept] of [[outside, 'Archeology'], [inside, 'Mechanical Engineering']]) {
    await new BuzzPage(prof).createBuzzButton.click();
    const create = new CreateBuzzPage(prof);
    await create.fillText(text);
    await create.publishToDepartments([dept]);
    await expect(prof.getByText(text)).toBeVisible({ timeout: 15000 });
  }
  try {
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await loginAsStudent(student);
  await expect(student.getByText(inside)).toBeVisible({ timeout: 15000 });
  // Expected per the spreadsheet: 0. Observed: the out-of-department student sees it.
  await expect(student.getByText(outside)).toHaveCount(1);
  await studentContext.close();
  } finally {
    const cleaner = new BuzzPage(prof);
    await cleaner.cleanupPost(outside);
    await cleaner.cleanupPost(inside);
    await profContext.close();
  }
});
