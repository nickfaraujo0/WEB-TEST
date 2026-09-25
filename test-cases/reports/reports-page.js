// @ts-check

export const REPORTS_URL = 'https://hive-dev.thegritcity.com/Reports';

/**
 * Page object for the Reports page — REBUILT 2026-09-24 against a confirmed, live redesign of
 * this feature. The entire previous version of this file (route-per-tab, antd `<label>`-based
 * fields, submit-time `.ant-form-item-explain-error` validation copy, a stripped-down Student
 * view) described a UI that no longer exists on hive-dev. Confirmed live, professor account
 * (nolan@wafer.ee):
 *
 * - **One single route.** There is no more `/Reports/Attendance` or `/Reports/Assessments` —
 *   everything lives at `/Reports` and the three report types are client-side view state, not
 *   navigation. Any test asserting on a per-tab URL is testing a route that doesn't exist.
 * - **The report-type switcher is three plain `<button>`s** ("Attendance" / "Assessments" /
 *   "Report cards"), not ARIA tabs — there is no `role="tab"` anywhere on this page.
 * - **A new top section, "Who the report covers"**, offers "Classes" (everyone in a program/
 *   year/division) vs. "My mentees" (everyone assigned as a mentor) — confirmed present on all
 *   three report types, and not something the old suite had any concept of.
 * - **A third report type now exists: "Report cards"**, on top of Attendance and Assessments.
 *   It reuses Assessments' own filters (Which class + Course, Grading criteria, Assessment
 *   types) and adds a "Students" picker (a STUDENT/DIVISION table) with its own "Select at
 *   least one student" gating text, ending in a **"Generate Report Cards"** button — confirmed
 *   still a real, non-idempotent generation action, so (matching the old suite's own judgment
 *   call) this is deliberately not exercised end-to-end by this page object's callers.
 * - **Program/Year/Division/Academic Year are still real antd `Select`s under the hood**
 *   (confirmed live: the `role="combobox"` inputs still carry the `.ant-select-selection-
 *   search-input` class, and the option list is still `.ant-select-item-option` inside
 *   `.ant-select-dropdown`), so the antd open-animation race this suite fixed before
 *   (multi-step `ant-slide-up-appear` classes settling before any option is actually visible)
 *   is still a live concern and `openSelect()` below keeps that fix. What changed is how a
 *   field is FOUND: there are no more `<label>` elements to walk forward from. Fields are
 *   grouped into plain `<section>` elements, each with its own heading ("Which class", "When",
 *   etc.) — `section(headingText)` below scopes to one of these, and callers pick the Nth
 *   combobox inside it (see `selectTrigger()`).
 * - **No more submit-time validation-error messages.** Confirmed live: clicking the submit
 *   button while required fields are empty does nothing — there is no `.ant-form-item-explain-
 *   error` flow anymore. Instead the submit button carries a genuine `disabled` attribute
 *   (`toBeDisabled()` works directly) until the form is complete, and a single status line in
 *   the sticky footer communicates why ("Choose a program, year and academic year" → "Ready to
 *   generate" → Report Cards' own "Select at least one student"). The old suite's 3 confirmed
 *   validation-copy typos ("Please select a Academic Year!", etc.) describe copy that no longer
 *   exists on this build.
 * - **Toggle-style controls (report-type buttons, Who-covers cards, Odd/Even, Full semester/
 *   Custom, Session Types chips, Grading Criteria pills) expose no ARIA pressed/selected state
 *   at all** (`aria-pressed`/`aria-selected` are both null on every one, confirmed live via
 *   `getAttribute`). The only signal is a CSS class swap: selected consistently carries
 *   `bg-green-50` (paired with `text-brandGreen`), unselected carries a plain gray/white class
 *   set. `isSelected()` below centralizes that check for every toggle group on this page.
 * - **Session Types defaults to nothing selected** with a "Select all" control; **Assessment
 *   Types defaults to everything selected** with a "Clear all" control — a real, confirmed
 *   asymmetry between the two, not a copy-paste inconsistency to "fix".
 * - Program/Academic Year still carry real duplicate options live (e.g. "Chemical Engineering"
 *   three times) and the option list still renders a couple of items without a proper
 *   `role="option"` (later/off-screen ones render as plain text nodes until scrolled into
 *   view — a virtualization artifact, not missing data). `chooseOption()` targets the real,
 *   visible `.ant-select-item-option` text, same convention as before.
 *
 * **Student role — re-verified live in a later pass this same session** (student0003@test.com):
 * the redesign above is Professor-only. The Student's own Reports view is the OLD, pre-redesign
 * UI, unchanged — real ARIA tabs at `/Reports/Attendance` and `/Reports/Assessments` (plural —
 * a real route/label mismatch, matching what the pre-rebuild file had already found), a small
 * Academic Year + Semester(Odd/Even pill) form, and a lightweight toast instead of a modal on
 * download. None of the old file's Student methods were mechanically carried over — each one
 * below was re-derived and independently re-confirmed live this session — but the *shape* of
 * what they found turned out to still be accurate, because the Student UI was simply never
 * touched by this redesign. See the "Student role" section of the class below.
 */
export class ReportsPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(REPORTS_URL, { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('heading', { name: 'Who the report covers' }).waitFor({ state: 'visible', timeout: 20000 });
    await this.waitForFormReady();
  }

  /** At least one real antd Select must be attached before any field interaction — same
   * async-render-race rationale as the old file's `waitForFormReady()`. */
  async waitForFormReady() {
    await this.page.locator('.ant-select-selection-search-input').first().waitFor({ state: 'attached', timeout: 20000 });
  }

  // ---- Layout: each labeled group of controls sits in its own <section> ----

  /** Scopes to the `<section>` containing the given heading text (e.g. "Which class", "When",
   * "Session types", "Grading criteria", "Assessment types", "Students"). */
  section(headingText) {
    return this.page.locator('section').filter({ has: this.page.getByRole('heading', { name: headingText, exact: true }) });
  }

  // ---- Report type switcher: Attendance / Assessments / Report cards (plain buttons, not tabs) ----

  reportTypeButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  async selectReportType(name) {
    await this.reportTypeButton(name).click();
    await this.waitForFormReady();
  }

  // ---- "Who the report covers": Classes / My mentees ----

  /** These buttons' accessible name includes their description text too (e.g.
   * "ClassesEveryone in a program, year and division"), so this matches by the title only via
   * substring rather than an exact name. */
  whoCoversButton(title) {
    return this.section('Who the report covers').getByRole('button').filter({ hasText: title });
  }

  // ---- Generic toggle-group selection check (shared by every chip/pill/card on this page) ----

  /** Confirmed live: selected state is a CSS class swap, never an ARIA attribute. Selected
   * buttons carry `bg-green-50`; unselected ones don't. */
  async isSelected(locator) {
    const cls = (await locator.getAttribute('class')) || '';
    return cls.includes('bg-green-50');
  }

  // ---- "Which class": Program / Year / (Course, Assessments+Report cards only) / Division ----

  /** The Nth real antd Select search-input inside a section, in DOM order. For "Which class":
   * index 0 = Program, 1 = Year, then either 2 = Division (Attendance) or 2 = Course /
   * 3 = Division (Assessments, Report cards) — confirmed live via the section's own text order
   * ("Computer Science, First year, All courses, All divisions" on Assessments/Report cards vs.
   * "Computer Science, First year, All divisions" on Attendance). Callers pass the right index
   * for the report type currently selected rather than this trying to guess it. */
  selectTriggerInSection(headingText, index) {
    return this.section(headingText).locator('.ant-select-selection-search-input').nth(index);
  }

  programSelect() {
    return this.selectTriggerInSection('Which class', 0);
  }

  yearSelect() {
    return this.selectTriggerInSection('Which class', 1);
  }

  /** Only present on Assessments and Report cards — do not call this on Attendance. */
  courseSelect() {
    return this.selectTriggerInSection('Which class', 2);
  }

  /** Index depends on report type: 2 on Attendance (no Course field), 3 on Assessments/Report
   * cards. Pass `hasCourseField: true` for the latter two. */
  divisionSelect({ hasCourseField = false } = {}) {
    return this.selectTriggerInSection('Which class', hasCourseField ? 3 : 2);
  }

  // ---- "When": Academic Year select, Odd/Even ----

  academicYearSelect() {
    return this.selectTriggerInSection('When', 0);
  }

  oddEvenButton(name) {
    return this.section('When').getByRole('button', { name, exact: true });
  }

  // ---- "Date range": Full semester / Custom ----

  dateRangeButton(name) {
    return this.section('Date range').getByRole('button', { name, exact: true });
  }

  dateRangeCoverageText() {
    return this.section('Date range').getByText(/^Covers /);
  }

  // ---- Opening/choosing an antd Select option (Program / Year / Division / Course / Academic Year) ----

  /**
   * Confirmed live via a MutationObserver probe (this suite's earlier fix, still valid — the
   * underlying antd Select component is unchanged): opening the dropdown runs a multi-step
   * slide animation (`ant-slide-up-appear-prepare` → `-start` → `-active` → settled), and
   * waiting only for `.ant-select-dropdown-hidden` to clear can resolve on the very first
   * animation frame before any option is actually visible. This waits for the animation to
   * settle AND a real option to be visible, retrying the open once (Escape, reopen) if the
   * list still isn't there.
   */
  async openSelect(input) {
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
  }

  /** Clicks a visible dropdown option by its exact text, scoped to the real (non-hidden) option
   * list. Confirmed live: Program/Academic Year still carry real duplicate option text (e.g.
   * "Chemical Engineering" x3) — `.first()` is intentional, matching this suite's established
   * convention for duplicate-text options. */
  async chooseOption(optionText) {
    await this.page.locator('.ant-select-item-option', { hasText: optionText }).first().click();
  }

  async selectField(input, optionText) {
    await this.openSelect(input);
    await this.chooseOption(optionText);
  }

  // ---- "Session types" (Attendance only): Select all + Lecture/Tutorial/Practical/Remedial Class ----

  sessionTypeButton(name) {
    return this.section('Session types').getByRole('button', { name, exact: true });
  }

  selectAllSessionTypesButton() {
    return this.sessionTypeButton('Select all');
  }

  // ---- "Attendance threshold" (Attendance only): number input + slider ----

  /** Confirmed live via outerHTML: this is now a plain `<input type="number" min="0" max="100">`
   * (implicit ARIA role `spinbutton`, so `getByRole('spinbutton')` still finds it) — NOT an antd
   * InputNumber. Defaults to **75** (not 100), range **0-100** (not 10-100), and carries no
   * `step` attribute at all (old suite's assumed step of 5 no longer applies). There are also no
   * more separate "Increase Value"/"Decrease Value" buttons — the slider (`thresholdSlider()`)
   * and typing into this input are the only two ways to change it now. */
  thresholdInput() {
    return this.section('Attendance threshold').getByRole('spinbutton');
  }

  thresholdSlider() {
    return this.section('Attendance threshold').getByRole('slider');
  }

  // ---- "Grading criteria" (Assessments, Report cards): All / Graded / Ungraded ----

  gradingCriteriaButton(name) {
    return this.section('Grading criteria').getByRole('button', { name, exact: true });
  }

  // ---- "Assessment types" (Assessments, Report cards): Clear all + type chips ----

  assessmentTypeButton(name) {
    return this.section('Assessment types').getByRole('button', { name, exact: true });
  }

  clearAllAssessmentTypesButton() {
    return this.assessmentTypeButton('Clear all');
  }

  // ---- "Students" (Report cards only) ----

  studentsSection() {
    return this.section('Students');
  }

  // ---- Sticky footer: status message + submit button ----

  /** The sticky footer bar holding both the status line and the submit button. */
  footer() {
    return this.page.locator('div.sticky.bottom-0');
  }

  /** The single status line that replaces the old per-field validation errors — e.g. "Choose a
   * program, year and academic year", "Ready to generate", or Report Cards' own "Select at
   * least one student". */
  statusMessage() {
    return this.footer().locator('p').first();
  }

  /** The submit button — label changes with report type ("Download Attendance Report",
   * "Download Assessments Report", "Generate Report Cards"). Confirmed live: this carries a
   * real `disabled` attribute (not just a CSS/aria state) while the form is incomplete, so
   * `toBeDisabled()`/`toBeEnabled()` work directly. */
  submitButton() {
    return this.footer().getByRole('button');
  }

  // ---- "Generating..." / success modals ----

  /** Confirmed live for both report types: the "Generating report" modal shows while a report
   * is being produced (same generic copy for Attendance and Assessments, not per-type). */
  generatingModal() {
    return this.page.getByText('Generating report', { exact: true });
  }

  /** Confirmed live: the success heading text is NOT constant across report types —
   * "Attendance report generated" for Attendance, "Marks report generated" for Assessments —
   * so this matches on the shared "report generated" suffix rather than one exact string. */
  successModalHeading() {
    return this.page.getByText(/report generated$/i);
  }

  /** Confirmed live: this exact body line IS constant across both confirmed report types. */
  successModalBody() {
    return this.page.getByText('Generated successfully and downloaded.', { exact: true });
  }

  successModalOkayButton() {
    return this.page.getByRole('button', { name: 'Okay', exact: true });
  }

  // ---- "Students" (Report cards only) — search + view toggle ----

  studentsSearchInput() {
    return this.studentsSection().getByPlaceholder('Search by name or roll number');
  }

  /** The STUDENT/DIVISION view-toggle buttons inside the Students picker. */
  studentsViewToggleButton(name) {
    return this.studentsSection().getByRole('button', { name, exact: true });
  }

  // ==========================================================================================
  // Student role — CONFIRMED LIVE 2026-09-24 (student0003@test.com) to be an entirely different,
  // UNCHANGED-by-this-redesign UI: the Student's own Reports view still uses the old per-tab
  // route/ARIA-tab architecture (`/Reports/Attendance`, `/Reports/Assessments` — plural, a real
  // confirmed route/label mismatch), NOT the single-route/plain-button Professor UI rebuilt
  // above. None of this was carried over from the pre-rebuild file (its Student methods
  // predated this session's redesign work entirely), so every method below was re-verified
  // fresh, live, this session, against the real Student account.
  // ==========================================================================================

  /** Confirmed live: real ARIA tabs (`role="tab"`, `aria-selected`), unlike the Professor's
   * plain report-type buttons. */
  get attendanceTab() {
    return this.page.getByRole('tab', { name: 'Attendance', exact: true });
  }

  get assessmentTab() {
    return this.page.getByRole('tab', { name: 'Assessment', exact: true });
  }

  /** Confirmed live (matches the pre-rebuild file's own finding, independently re-confirmed
   * this session): the top page heading text exists BOTH as a plain `<div>` (the persistent
   * one) and, transiently right after a fresh login, as a real `<h2>` of the same text — a
   * genuine strict-mode double-match, not a one-off flake. `.first()` sidesteps it. */
  pageHeading(text) {
    return this.page.getByText(text, { exact: true }).first();
  }

  /** The Student's own "Academic Year" antd Select (still a real `.ant-select`, same widget
   * family as the Professor's, confirmed live). */
  studentAcademicYearSelect() {
    return this.page.locator('.ant-select-selection-search-input').first();
  }

  /** The Even/Odd semester pill (Attendance) — also present, same component, on Assessment. */
  studentSemesterButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Confirmed live via className: the Student's Even/Odd pill uses a DIFFERENT selected-state
   * class than every Professor toggle on this page — selected carries `bg-white` (plus
   * `shadow-sm`), NOT `bg-green-50`. Do not reuse `isSelected()` for this control. */
  async isStudentSemesterSelected(locator) {
    const cls = (await locator.getAttribute('class')) || '';
    return cls.includes('bg-white');
  }

  downloadAttendanceReportButtonStudent() {
    return this.page.getByRole('button', { name: 'Download Attendance Report', exact: true });
  }

  downloadReportCardButtonStudent() {
    return this.page.getByRole('button', { name: 'Download Report Card', exact: true });
  }

  /** Confirmed live: a lightweight toast, not a modal — "Report downloaded" (Attendance) /
   * "Report card downloaded" (Assessment), each with a green check icon. */
  studentToast(text) {
    return this.page.getByText(text, { exact: true });
  }
}
