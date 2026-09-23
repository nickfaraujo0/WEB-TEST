// @ts-check

export const REPORTS_ATTENDANCE_URL = 'https://hive-dev.thegritcity.com/Reports/Attendance';
// Confirmed live 2026-09-23: the Assessment sub-tab's own URL is the PLURAL "/Reports/Assessments"
// even though the tab label, page heading, and Student's page heading all say "Assessment"
// (singular) — a real, if harmless, naming inconsistency between the route and the UI text.
export const REPORTS_ASSESSMENT_URL = 'https://hive-dev.thegritcity.com/Reports/Assessments';

/**
 * Page object for the Reports tab: Attendance and Assessment sub-tabs, Professor and Student
 * views.
 *
 * Confirmed live 2026-09-23 against the professor account (nolan@wafer.ee) and the student
 * account (student0003@test.com, "Three"). The professor's Attendance/Assessment forms are
 * full antd forms (Select/Checkbox/InputNumber/DatePicker) with Program/Semester/Academic
 * Year/etc. filters; the Student's are a much smaller subset (Academic Year + Semester only,
 * plus a single Download button) — a confirmed real, deliberate role difference, not a
 * partially-built page: the Student's own heading even reads "Assessment Report Card"
 * (Professor's reads "Assessment Report"), and the Student's Semester control offers only
 * whichever of Even/Odd actually exists for the chosen Academic Year (confirmed live: 2024-25
 * offers only "Odd" for this account, 2025-26 offers both).
 *
 * The tablist's "..." overflow button (`.ant-tabs-nav-more`) is a real DOM node but confirmed
 * live via outerHTML to be `visibility: hidden; aria-hidden="true"` — antd's generic overflow
 * control for when tabs don't fit, inert with only 2 tabs here (same family of red herring as
 * Courses' hamburger-toggle-vs-Buzz-icon mixup). Not part of this page object.
 *
 * Program/Semester/Academic Year/Course dropdowns are real antd `Select`s. Confirmed live via
 * outerHTML: the underlying virtualized `role="listbox"` renders a couple of HIDDEN
 * placeholder `<div role="option">` nodes carrying raw internal ids (e.g.
 * "n86Nl1NnYcrLCvMExdsL") ahead of the real, visible `.ant-select-item-option` list — a
 * rendering quirk of the virtual list itself, not real data, and not something a real user
 * ever sees. Locators here target the visible `.ant-select-item-option` by its text, not a
 * bare `getByText` against the whole page, to avoid ever matching those hidden id nodes.
 *
 * Program and Academic Year both have real live DUPLICATE options (e.g. "Chemical
 * Engineering" appears 3 times, "Computer Science" appears twice) — confirmed real data, not
 * a locator bug. Selecting by text and taking `.first()` is intentional here, matching the
 * Courses suite's `courseCard()` convention for the same kind of duplicate-text situation.
 *
 * Validation copy has several confirmed real typos, reproduced verbatim in the specs that
 * assert on them rather than "corrected": "Please select a Academic Year!" (missing "n"),
 * "Please select an Start Date!" / "an End Date!" (wrong article), and "Please select at
 * least one the Session/Assessment Types!" (missing "of").
 */
export class ReportsPage {
  constructor(page) {
    this.page = page;

    this.attendanceTab = page.getByRole('tab', { name: 'Attendance' });
    this.assessmentTab = page.getByRole('tab', { name: 'Assessment' });
  }

  /**
   * The top page heading ("Attendance Report" / "Assessment Report"). An earlier version of
   * this comment claimed the app renders NO semantic heading elements anywhere on this page —
   * that was wrong. Confirmed live via two real failed runs' own error-context snapshots
   * (both TC001 attempts, immediately after a FRESH login): the page briefly renders BOTH the
   * persistent outer `<div>` ("Attendance Report") AND a real `<h2>Attendance Report</h2>`
   * loading-skeleton heading at once — a genuine, consistently-reproducible strict-mode double
   * match on every fresh-login landing, not a rare transient. `waitForFormReady()` (which only
   * waits for a Select's search input to be *attached*) does not reliably wait long enough for
   * that skeleton `<h2>` to unmount. Since both elements always carry the identical text, this
   * scopes to `.first()` rather than trying to out-wait the skeleton.
   */
  pageHeading(text) {
    return this.page.getByText(text, { exact: true }).first();
  }

  /**
   * Confirmed live via a real headless-Chromium run: the tab button itself becomes visible
   * well before the tabpanel's own form fields finish rendering (a real async-data race, not a
   * flake) — a test that starts interacting with e.g. Program immediately after only the tab
   * was confirmed visible can click a not-yet-fully-mounted Select and silently open nothing
   * (TC024 hit exactly this: `openSelect('Program')` didn't error, but the option list it was
   * supposed to open never appeared). Waiting for the first real antd Select's search input
   * (present in every Professor/Student x Attendance/Assessment combination — at minimum
   * "Academic Year" always has one) is a role-agnostic, form-agnostic readiness signal.
   */
  async waitForFormReady() {
    await this.page.locator('.ant-select-selection-search-input').first().waitFor({ state: 'attached', timeout: 20000 });
  }

  async gotoAttendance() {
    await this.page.goto(REPORTS_ATTENDANCE_URL, { waitUntil: 'domcontentloaded' });
    await this.attendanceTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.waitForFormReady();
  }

  async gotoAssessment() {
    await this.page.goto(REPORTS_ASSESSMENT_URL, { waitUntil: 'domcontentloaded' });
    await this.assessmentTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.waitForFormReady();
  }

  // ---- Shared antd Select fields (Program / Semester / Academic Year / Division / Course) ----

  /** The `.ant-form-item` wrapping a field, found by its own visible `<label>` text. Confirmed
   * live: label and control are siblings inside `.ant-form-item-control-input-content`, itself
   * inside `.ant-form-item` (which also holds the field's `.ant-form-item-explain-error`). */
  formItem(labelText) {
    return this.page.locator('.ant-form-item').filter({ has: this.page.locator('label', { hasText: labelText }) });
  }

  /**
   * The antd Select trigger for a given label, found by walking forward from the `<label>`
   * itself rather than through `.ant-form-item` (same "following::" convention as
   * courses-page.js's `facultySelect()`/`unitOption()`). Confirmed live via a real
   * headless-Chromium run: the Professor's fields DO sit inside `.ant-form-item`, but the
   * Student's own "Academic Year" field (TC027-034) does not — it's a plain
   * `<div class="flex flex-col gap-1">` with no antd Form wrapper at all. Walking forward from
   * the label works for both layouts; `formItem()` (Professor-only concepts like validation
   * errors) still requires the antd Form wrapper.
   */
  selectTrigger(labelText) {
    return this.page
      .locator('label')
      .filter({ hasText: new RegExp(`^${labelText}$`) })
      .locator('xpath=following::div[contains(@class,"ant-select")][1]');
  }

  /**
   * Confirmed live via a real headless-Chromium run: clicking the OUTER `.ant-select` div right
   * after `waitForFormReady()` can succeed as a Playwright action (the div itself is visible/
   * stable) without actually opening the dropdown — the real interactive element is the inner
   * `.ant-select-selection-search-input`, and antd/React can take a moment longer to finish
   * wiring its open-on-click handler than the outer div takes to become "actionable". A plain,
   * non-`force` click on the inner input is what protects against that race (Playwright's own
   * actionability wait won't dispatch until the input reports stable/receiving-events) — this
   * was reconfirmed live: a `.ant-select-selector`-level click reintroduced the exact same
   * "succeeds without opening" failure on Program/Semester's very first interaction.
   *
   * That plain click alone isn't enough for every field, though: confirmed live via a real
   * failed run's own call log (TC029) that once a Select already has a value (e.g. the
   * Student's Academic Year, pre-filled to "2025-26"), antd renders `.ant-select-selection-item`
   * as a SIBLING of the search-input's wrapping span, both occupying the exact same rect — the
   * item span paints on top and permanently intercepts every pointer event there, so the plain
   * click's actionability check can never pass for that field and just retries for the full
   * timeout with no error. Since these two races need opposite handling (wait-and-don't-force
   * vs. force-through-a-permanent-overlap), this tries the safe plain click first with a short
   * timeout, and only falls back to `force: true` on failure — covering the empty-placeholder
   * case (the common path, never forced) and the already-has-a-value case (falls back, and by
   * then the form has long since finished hydrating so forcing early-click risk is moot) with
   * one method.
   *
   * Confirmed live via a real failed run (TC005) that `.ant-select-item-option` can resolve to
   * the correct, correctly-titled option node and still report `toBeVisible()` as "hidden" for
   * the full assertion timeout — and, separately, that the whole option list can go missing
   * entirely a moment after opening. Confirmed live via a MutationObserver instrumenting
   * `.ant-select-dropdown`'s own `class` attribute through a real open (a throwaway probe, since
   * deleted) that antd opens the dropdown through a multi-step slide animation
   * (`ant-slide-up-appear-prepare` → `-start` → `-active` → settled with no `appear` class at
   * all) — waiting only for `ant-select-dropdown-hidden` to clear (an earlier version of this
   * fix) resolves on the very first animation frame, not the settled one, which explains the
   * "hidden" symptom but NOT the separate "list vanished entirely" symptom also observed.
   *
   * Confirmed live via a direct repro (`TC004` then `TC005` in the same `npx playwright test`
   * invocation reproduces a failure every time; `TC005` run alone never does, despite both
   * getting a fresh browser context/page — the only shared resource is the underlying browser
   * process) that this is a real animation/rendering race sensitive to the browser process
   * already being warm from a previous test, not a bug in this suite's own selector logic. The
   * exact mechanism by which a prior test's teardown perturbs the NEXT test's fresh page's
   * dropdown animation was not fully isolated (see summary.md) — rather than keep chasing a
   * precise root cause, this waits for the animation to settle AND for a real option to
   * actually be visible, and retries the whole open once (close via Escape, reopen) if the list
   * still isn't there, which is a legitimate defense against a genuinely intermittent render
   * race rather than papering over a deterministic one.
   */
  async openSelect(labelText) {
    const trigger = this.selectTrigger(labelText);
    const input = trigger.locator('.ant-select-selection-search-input');
    const settledDropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden):not(.ant-slide-up-appear)').first();
    const anyOption = this.page.locator('.ant-select-item-option').first();

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await input.click({ timeout: 5000 });
      } catch {
        await input.click({ force: true });
      }
      await settledDropdown.waitFor({ state: 'visible', timeout: 10000 });
      const listAppeared = await anyOption.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
      if (listAppeared) return;
      await this.page.keyboard.press('Escape').catch(() => {});
    }
    // Final attempt already ran above; let its own absence surface as a normal locator failure
    // in the caller rather than throwing a redundant error here.
  }

  /** Clicks a visible dropdown option by its exact text, scoped to the real (non-hidden)
   * option list so the hidden virtual-list id placeholders can never match. */
  async chooseOption(optionText) {
    await this.page.locator('.ant-select-item-option', { hasText: optionText }).first().click();
  }

  async selectField(labelText, optionText) {
    await this.openSelect(labelText);
    await this.chooseOption(optionText);
  }

  fieldValidationError(labelText) {
    return this.formItem(labelText).locator('.ant-form-item-explain-error');
  }

  fieldPlaceholder(labelText) {
    return this.selectTrigger(labelText).locator('.ant-select-selection-placeholder');
  }

  // ---- Date pickers (Start Date / End Date) ----

  dateInput(labelText) {
    return this.formItem(labelText).locator('.ant-picker-input input');
  }

  async openDatePicker(labelText) {
    await this.dateInput(labelText).click();
  }

  /**
   * The currently-in-view, clickable calendar cell for a given day-of-month number (1-31).
   * Confirmed live via a real headless-Chromium run (`document.elementFromPoint`): every day
   * before today is rendered with `.ant-picker-cell-disabled`, and a disabled cell's own click
   * target falls through to the wrapping `<table class="ant-picker-content">` — Playwright
   * correctly reports this as "table intercepts pointer events" and retries for the full
   * timeout rather than ever clicking through a disabled date. This locator explicitly excludes
   * `.ant-picker-cell-disabled` so a test that (by mistake) asks for a past day fails fast with
   * a clear "not found" instead of hanging for 20s per attempt. Callers must pick a day that is
   * today or later, and must already be on the right month (this suite always uses a
   * comfortably-future day in the current month for exactly this reason).
   */
  calendarDay(day) {
    return this.page
      .locator('.ant-picker-cell-in-view:not(.ant-picker-cell-disabled)')
      .filter({ hasText: new RegExp(`^${day}$`) })
      .first();
  }

  /** The LAST enabled (today-or-later) in-view day of whatever month is currently showing —
   * always a safe, valid pick regardless of what day of the month "today" happens to be on the
   * day a run executes, unlike a hardcoded day number which could itself fall in the past. Used
   * throughout this suite instead of guessing a specific day like "28". */
  lastEnabledCalendarDay() {
    return this.page.locator('.ant-picker-cell-in-view:not(.ant-picker-cell-disabled)').last();
  }

  // ---- Checkbox groups (Session Types / Assessment Types) ----

  checkboxLabel(name) {
    return this.page.locator('label.ant-checkbox-wrapper', { hasText: name }).first();
  }

  checkbox(name) {
    return this.checkboxLabel(name).locator('input[type="checkbox"]');
  }

  async toggleCheckbox(name) {
    await this.checkboxLabel(name).click();
  }

  // ---- Grading Criteria pills (Assessment tab only: All / Graded / Ungraded) ----

  gradingCriteriaButton(name) {
    return this.formItem('Grading Criteria').getByRole('button', { name, exact: true });
  }

  /** Confirmed live via className: the selected pill carries `bg-brandGreen` + white text;
   * the other two carry `border border-brandGreen` on a white background. */
  async isGradingCriteriaSelected(name) {
    const cls = (await this.gradingCriteriaButton(name).getAttribute('class')) || '';
    return cls.includes('bg-brandGreen');
  }

  // ---- Attendance Threshold (antd InputNumber, Attendance tab only) ----

  thresholdInput() {
    return this.page.locator('input.ant-input-number-input');
  }

  thresholdIncreaseButton() {
    return this.page.getByRole('button', { name: 'Increase Value' });
  }

  thresholdDecreaseButton() {
    return this.page.getByRole('button', { name: 'Decrease Value' });
  }

  // ---- Submit buttons ----

  downloadReportButton() {
    return this.page.getByRole('button', { name: 'Download Report', exact: true });
  }

  downloadAssessmentReportButton() {
    return this.page.getByRole('button', { name: 'Download Assessment Report', exact: true });
  }

  /** Confirmed live: a separate, distinctly-styled (dark) submit button on the Assessment tab.
   * Deliberately NOT exercised end-to-end by this suite — see reports-helpers.js and
   * summary.md for why. */
  generateReportCardsButton() {
    return this.page.getByRole('button', { name: 'Generate Report Cards', exact: true });
  }

  // ---- "Generating..." / success modals (Professor download flows) ----

  /** Confirmed live: the Attendance tab's in-flight modal heading is "Generating Report";
   * the Assessment tab's own Download button instead shows "Generating Assessment Report" —
   * a real, if minor, copy difference between the two otherwise-identical flows. */
  generatingModal(headingText) {
    return this.page.locator('.ant-modal-content').filter({ hasText: headingText });
  }

  successModalHeading() {
    return this.page.getByText('Report Generated Successfully', { exact: true });
  }

  successModalOkayButton() {
    return this.page.getByRole('button', { name: 'Okay', exact: true });
  }

  // ---- Student views (Attendance: Academic Year + Semester; Assessment: same + "Report Card") ----

  studentSemesterButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Confirmed live via className: the selected Even/Odd pill carries `bg-white shadow-sm`;
   * the other carries plain `text-gray-500` with no background. */
  async isStudentSemesterSelected(name) {
    const cls = (await this.studentSemesterButton(name).getAttribute('class')) || '';
    return cls.includes('bg-white') && cls.includes('shadow-sm');
  }

  studentAcademicYearSelect() {
    return this.page.locator('.ant-select').first();
  }

  downloadAttendanceReportButtonStudent() {
    return this.page.getByRole('button', { name: 'Download Attendance Report', exact: true });
  }

  downloadReportCardButtonStudent() {
    return this.page.getByRole('button', { name: 'Download Report Card', exact: true });
  }

  studentDownloadedToast() {
    return this.page.getByText('Report downloaded', { exact: true });
  }
}
