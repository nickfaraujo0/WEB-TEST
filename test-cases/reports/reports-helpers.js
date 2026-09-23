// @ts-check
import { expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ReportsPage } from './reports-page.js';

/** Log in with the named credentials (default: the professor account) and land on Buzz. Same
 * convention as courses-helpers.js's loginAs. */
export async function loginAs(page, emailKey = 'HIVE_VALID_EMAIL', passwordKey = 'HIVE_VALID_PASSWORD') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential(emailKey), credential(passwordKey));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
}

export const STUDENT = ['HIVE_STUDENT_EMAIL', 'HIVE_STUDENT_PASSWORD'];

/**
 * A Program/Semester/Academic Year combination confirmed live 2026-09-23 on the professor
 * account (nolan@wafer.ee) to exist and to leave both Division (Attendance tab) and Course
 * (Assessment tab) with no real options — i.e. this combination is safe to submit through
 * "Download Report" / "Download Assessment Report" without ever needing to pick a specific
 * real division or course.
 */
export const REPORT_FILTERS = {
  program: 'Computer Science',
  semester: 'Semester 1',
  academicYear: '2025-26',
};

/**
 * Fills the Program/Semester/Academic Year fields common to both the Attendance and
 * Assessment professor forms, using `REPORT_FILTERS`. Does not touch Division/Course
 * (both optional, confirmed live) or Session/Assessment Types (left to the caller, since the
 * two tabs use different labels/values for that group).
 */
export async function fillCommonFilters(reports) {
  await reports.selectField('Program', REPORT_FILTERS.program);
  await reports.selectField('Semester', REPORT_FILTERS.semester);
  await reports.selectField('Academic Year', REPORT_FILTERS.academicYear);
}

/**
 * Report generation is confirmed live to be genuinely variable in duration: the exact same
 * "Download Report" submission observed anywhere from ~3s to ~35s to reach the
 * "Report Generated Successfully" modal in back-to-back runs during manual verification
 * (no app error either time — a real backend/report-generation latency characteristic, the
 * same family of confirmed real slowness as Courses' documented ~7.6MB bundle comment). Tests
 * that submit a real report use this generous timeout rather than the default 15s expect
 * timeout, so that slowness alone never produces a false failure.
 */
export const REPORT_GENERATION_TIMEOUT = 60000;

/** Waits for the "Report Generated Successfully" modal and dismisses it via "Okay". Confirmed
 * live: the modal can take well past the default expect timeout to appear (see
 * REPORT_GENERATION_TIMEOUT above), and clicking "Okay" closes it cleanly with no other
 * cleanup required (this whole flow is a read-only download, never a data mutation — see
 * summary.md for the live verification that established this). */
export async function submitAndExpectSuccess(reports, page) {
  await expect(reports.successModalHeading()).toBeVisible({ timeout: REPORT_GENERATION_TIMEOUT });
  await reports.successModalOkayButton().click();
  await expect(reports.successModalHeading()).toBeHidden({ timeout: 10000 });
}
