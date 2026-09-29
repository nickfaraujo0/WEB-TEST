// @ts-check

export const COURSES_URL = 'https://hive-dev.thegritcity.com/Courses/';

/**
 * Page object for the Courses list, a course's Divisions sidebar, and the Schedule/Lesson
 * Plan tab (calendar + session list) inside a division — Professor view unless noted.
 *
 * Confirmed live 2026-09-22 against "Mechanics of Solids" (ME101, one division "Div A") and
 * "Data Structures and Algorithms" (DSA-123, many divisions incl. "BLE Test V1.1").
 *
 * Course-detail controls (tab pills, Participants, Filters, Edit Schedule, Add Session, the
 * session card's "..." menu, Take Attendance, Add Lesson Diary) are plain `div`s with
 * `cursor-pointer` and no ARIA role — same pattern as BuzzPage's card actions — so most of
 * this is `getByText`/`locator`, not `getByRole`. Session Type / Batches / Participants /
 * Unit pills inside the New Session, Edit Session and Add Time Slot forms ARE real
 * `<button>` elements (confirmed via `el.disabled` on the student's read-only copy of the
 * same form), so those use `getByRole('button', ...)`.
 */
export class CoursesPage {
  constructor(page) {
    this.page = page;

    // Courses list
    this.yourCoursesHeading = page.getByText('Your courses', { exact: true });

    // Course-detail header
    this.courseInfoButton = page.getByText('Course Info', { exact: true });

    // Divisions sidebar — each tab is a `<p>` inside a `cursor-pointer rounded-full` div; the
    // active one carries `bg-[#3F4045]` (confirmed live via outerHTML), others don't.
    this.divisionsLabel = page.getByText('Divisions', { exact: true });
    /** Confirmed live via outerHTML: a real antd icon-only `<button class="ant-btn-icon-only">`
     * directly left of the division heading row — not a raw `<svg>` (an earlier guess here
     * matched the wrong icon and actually navigated to Buzz when clicked, confirmed by a real
     * test run). */
    this.hamburgerToggle = page.locator('button.ant-btn-icon-only').first();

    // Toolbar
    this.participantsDropdownTrigger = page.locator('.ant-dropdown-trigger', { hasText: 'Participants' });
    this.filtersButton = page.getByText('Filters', { exact: true });
    this.editScheduleButton = page.getByText('Edit Schedule', { exact: true });
    this.addSessionButton = page.getByText('Add Session', { exact: true });
    this.setUpSemesterButton = page.getByText('Set Up Your Semester', { exact: true });
    /** Confirmed live: this is a real `textbox`, so its month/year lives in its `value`
     * attribute (check with `toHaveValue`), not as page text `getByText` can match. */
    this.monthLabel = page.getByRole('textbox', { name: 'Select month' });
    this.loadNextMonthButton = page.getByText('Load Next Month', { exact: true });
    this.noSessionsYetHeading = page.getByText('No sessions yet!', { exact: true });

    // Session cards — the repeating card container confirmed live via DOM ancestry from an
    // "Untitled session" title: `div.rounded-2xl.border.border-gray-200` wraps one whole card.
    this.sessionCards = page.locator('div.rounded-2xl.border.border-gray-200');
  }

  async goto() {
    await this.page.goto(COURSES_URL, { waitUntil: 'domcontentloaded' });
    await this.yourCoursesHeading.waitFor({ state: 'visible', timeout: 20000 });
  }

  /** Confirmed live (real run, not just manual exploration): a course's title AND its
   * description paragraph can both render the exact course name (e.g. "Data Structures and
   * Algorithms" is both the card title and its own description), so `getByText(name, {exact:
   * true})` alone hits Playwright's strict-mode violation. `.first()` is the title. */
  courseCard(name) {
    return this.page.getByText(name, { exact: true }).first();
  }

  async openCourse(name) {
    // The course list can take well over the 20s action timeout to appear on hive-dev (its
    // ~7.6MB bundle) — confirmed by a real run 2026-09-29 — so wait for the card explicitly.
    await this.courseCard(name).waitFor({ state: 'visible', timeout: 60000 });
    await this.courseCard(name).click();
  }

  /**
   * Confirmed live (real run): the current division's name is ALSO echoed as the page's own
   * heading next to the toolbar, so an unscoped `getByText` hits a strict-mode violation
   * against a division whose name matches the active one. A first fix scoped this to
   * `.roundScroll`, which a second real run proved WRONG — that's a generic scrollbar-styling
   * class reused on the toolbar row too (also `roundScroll`), so it still matched both places.
   * The sidebar is a real `<aside>` (confirmed live via the accessibility tree: role
   * "complementary"), which is unique on this page and semantically correct to key off.
   */
  divisionsSidebar() {
    return this.page.getByRole('complementary');
  }

  divisionTab(name) {
    return this.divisionsSidebar().getByText(name, { exact: true });
  }

  /** The active division tab carries `bg-[#3F4045]` (dark pill); others are transparent/light. */
  async isDivisionActive(name) {
    const el = this.divisionTab(name).locator('xpath=ancestor::div[contains(@class,"rounded-full")][1]');
    const cls = (await el.getAttribute('class')) || '';
    return cls.includes('3F4045');
  }

  tabPill(name) {
    return this.page.getByText(name, { exact: true });
  }

  async openParticipantsMenu() {
    await this.participantsDropdownTrigger.click();
  }

  /** A batch checkbox (All / B1 / B2 / ...) inside the open Participants dropdown. */
  participantsCheckbox(name) {
    return this.page.getByRole('checkbox', { name, exact: true }).or(this.page.getByText(name, { exact: true }));
  }

  async toggleParticipant(name) {
    await this.page.getByText(name, { exact: true }).first().click();
  }

  async openFilters() {
    await this.filtersButton.click();
  }

  filtersDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Filters' });
  }

  filterOption(name) {
    return this.filtersDialog().getByText(name, { exact: true });
  }

  filtersApplyButton() {
    return this.filtersDialog().getByRole('button', { name: 'Apply' });
  }

  filtersClearAllButton() {
    return this.filtersDialog().getByText('Clear all', { exact: true });
  }

  /** One session card whose visible text contains `text` (usually a date or "Untitled session"). */
  cardByText(text) {
    return this.sessionCards.filter({ hasText: text });
  }

  /** The round "..." icon button in a card's action row — confirmed live via outerHTML as the
   * card's own `.ant-dropdown-trigger` (a 9x9 rounded circle wrapping a 3-dot svg). Not
   * rendered at all on the student's read-only card (confirmed live). */
  cardMenuTrigger(card) {
    return card.locator('.ant-dropdown-trigger');
  }

  takeAttendanceButton(card) {
    return card.getByText('Take Attendance', { exact: true });
  }

  addLessonDiaryLink(card) {
    return card.getByText('Add Lesson Diary', { exact: true });
  }

  completedBadge(card) {
    return card.getByText('Completed', { exact: true });
  }

  /** Confirmed live: styled uppercase via CSS, but the real DOM text is "Present". */
  presentBadge(card) {
    return card.getByText('Present', { exact: true });
  }

  menuItem(name) {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  // ---- New Session dialog ----

  newSessionDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'New Session' });
  }

  sessionDateInput() {
    return this.newSessionDialog().locator('input').first();
  }

  sessionTypePill(name) {
    return this.newSessionDialog().getByRole('button', { name, exact: true });
  }

  batchPill(name) {
    return this.newSessionDialog().getByRole('button', { name, exact: true });
  }

  unitPill(name) {
    return this.newSessionDialog().getByRole('button', { name, exact: true });
  }

  topicsCoveredEditor() {
    return this.newSessionDialog().locator('.ql-editor');
  }

  createSessionButton() {
    return this.newSessionDialog().getByRole('button', { name: 'Create Session' });
  }

  cancelNewSessionButton() {
    return this.newSessionDialog().getByText('Cancel', { exact: true });
  }

  // ---- Reschedule Session dialog ----

  rescheduleDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Reschedule Session' });
  }

  rescheduleDateTimeInput() {
    return this.rescheduleDialog().locator('input');
  }

  rescheduleSaveButton() {
    return this.rescheduleDialog().getByRole('button', { name: 'Save' });
  }

  rescheduleCancelButton() {
    return this.rescheduleDialog().getByText('Cancel', { exact: true });
  }

  // ---- Delete Session dialog ----

  deleteConfirmDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Delete this session?' });
  }

  deleteConfirmButton() {
    return this.deleteConfirmDialog().getByRole('button', { name: 'Delete', exact: true });
  }

  deleteCancelButton() {
    return this.deleteConfirmDialog().getByRole('button', { name: 'Cancel', exact: true });
  }

  // ---- Edit Session page (full navigation, breadcrumb "Schedule > Unnamed Lecture") ----

  sessionDetailsHeading() {
    return this.page.getByText('Session Details', { exact: true });
  }

  attendanceRecordsButton() {
    return this.page.getByRole('button', { name: 'Attendance Records' });
  }

  saveChangesButton() {
    return this.page.getByRole('button', { name: 'Save Changes' });
  }

  sessionTypeField(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  participantBatchField(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  selectAllParticipantsCheckbox() {
    return this.page.getByText('Select all', { exact: true });
  }

  plannedTopicEditor() {
    return this.page.getByText('Planned Topic', { exact: true }).locator('xpath=following::div[contains(@class,"ql-editor")][1]');
  }

  coveredTopicEditor() {
    return this.page.getByText('Covered Topic', { exact: true }).locator('xpath=following::div[contains(@class,"ql-editor")][1]');
  }

  remarksEditor() {
    return this.page.getByText('Remarks', { exact: true }).locator('xpath=following::div[contains(@class,"ql-editor")][1]');
  }

  facultySelect() {
    return this.page.getByText('Faculty', { exact: true }).locator('xpath=following::*[1]');
  }

  locationInput() {
    return this.page.getByPlaceholder('e.g. Lecture Hall 2, Lab A1, Online');
  }

  unitOption(name) {
    return this.page.getByRole('radio', { name, exact: true });
  }

  /** Confirmed live via accessibility snapshot: unlike Teaching Method (below), a Course
   * Outcome's accessible name sits on the wrapping `<button>`, not the checkbox nested inside
   * it — the checkbox itself has no name of its own, so `getByRole('checkbox', {name})` alone
   * never matches it. */
  courseOutcomeOption(name) {
    return this.page.getByRole('button', { name, exact: true }).getByRole('checkbox');
  }

  teachingMethodOption(name) {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  deleteSessionRecordsLink() {
    return this.page.getByText('Delete Session Records', { exact: true });
  }

  buzztErrorDialog() {
    return this.page.getByText('Buzzt!', { exact: true });
  }

  // ---- Edit Schedule wizard (full-page, 3 steps: Add Timetable / Add Topic Sequence / Preview) ----

  wizardExitButton() {
    return this.page.getByText('Exit', { exact: true });
  }

  wizardExitConfirmDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'All changes will be lost' });
  }

  wizardExitConfirmCloseButton() {
    return this.wizardExitConfirmDialog().getByRole('button', { name: 'Close' });
  }

  wizardExitConfirmCancelButton() {
    return this.wizardExitConfirmDialog().getByRole('button', { name: 'Cancel' });
  }

  wizardStepLabel(text) {
    return this.page.getByText(text, { exact: true });
  }

  semesterStartInput() {
    return this.page.getByText('Semester start', { exact: true }).locator('xpath=following::input[1]');
  }

  semesterEndInput() {
    return this.page.getByText('Semester end', { exact: true }).locator('xpath=following::input[1]');
  }

  dayRow(day) {
    return this.page.getByText(day, { exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-full") or contains(@class,"border")][1]');
  }

  addTimeSlotLink(day) {
    return this.dayRow(day).getByText('Add Time Slot', { exact: false });
  }

  addTimeSlotDialog(day) {
    return this.page.getByRole('dialog').filter({ hasText: `Add Time Slot for ${day}` });
  }

  bulkImportCsvCard() {
    return this.page.getByText('Bulk import via CSV', { exact: true });
  }

  addManuallyCard() {
    return this.page.getByText('Add manually', { exact: true });
  }

  skipForNowButton() {
    return this.page.getByRole('button', { name: 'Skip For Now' });
  }

  wizardNextButton() {
    return this.page.getByRole('button', { name: 'Next' });
  }

  wizardBackButton() {
    return this.page.getByRole('button', { name: 'Back' });
  }

  previewTable() {
    return this.page.getByText('Preview your schedule', { exact: true }).locator('xpath=following::table[1]');
  }

  createScheduleButton() {
    return this.page.getByRole('button', { name: 'Create Schedule' });
  }

  // ---- New Session: date/time (confirmed live 2026-09-29) ----

  /** Real antd date picker input; accepts typed "D MMMM YYYY" + Enter (confirmed live). With a
   * later month in view, it defaults to the same day-of-month in that month, not today. */
  newSessionDateInput() {
    return this.newSessionDialog().getByPlaceholder('Select date');
  }

  newSessionTimeInput() {
    return this.newSessionDialog().getByPlaceholder('Select time');
  }

  /** The month/year picker above the session list ("Sep, 2026"); its panel lists Jan–Dec. */
  async pickMonth(shortMonth) {
    await this.monthLabel.click();
    await this.page.locator('.ant-picker-dropdown:visible .ant-picker-cell-in-view').filter({ hasText: new RegExp(`^${shortMonth}$`) }).click();
  }

  // ---- Edit Session page: more fields (confirmed live 2026-09-29, /Courses/editLog) ----

  /** The page has exactly one date and one time picker (Schedule Date / Session Start Time). */
  editDateInput() {
    return this.page.getByPlaceholder('Select date');
  }

  /** Duration is an antd InputNumber (hours), not a text box like New Session's "1h". */
  durationInput() {
    return this.page.locator('.ant-input-number-input');
  }

  /** "Buzz! Session Details updated successfully." with "Back to Schedule" / "Close" — Save
   * Changes succeeds as of 2026-09-29 (it used to fail with a "Buzzt!" conflict, see TC034). */
  saveSuccessDialog() {
    return this.page.locator('.ant-modal').filter({ hasText: 'Session Details updated successfully.' });
  }

  /** Confirm shown by "Delete Session Records": its buttons are Delete and Cancel. */
  deleteRecordsConfirmDialog() {
    return this.page.locator('.ant-modal').filter({ has: this.page.getByRole('button', { name: 'Delete', exact: true }) });
  }

  // ---- Attendance Records page (confirmed live 2026-09-29, /Courses/edit-attendance) ----

  updateAttendanceButton() {
    return this.page.getByRole('button', { name: 'Update Attendance' });
  }

  /** One student's row: a bordered rounded box holding roll no., name and the status control. */
  attendanceRow(studentName) {
    return this.page.locator('div.rounded-button.border').filter({ hasText: studentName });
  }

  /** The row's status pill ("Present"/"Absent"). Clicking it toggles the status directly — there
   * is no option menu (confirmed live). Unsaved until "Update Attendance". */
  attendanceStatus(studentName) {
    return this.attendanceRow(studentName).locator('.ant-dropdown-trigger').first();
  }

  /** The Present / Absent total box at the top of the page (label, then the number). They
   * reflect the saved attendance: they update after "Update Attendance", not on each toggle. */
  attendanceCount(label) {
    // Scoped to the total boxes (`mt-4 animate-comein`), not the student rows, whose status
    // pills also say Present/Absent — a looser match read a row's "Present" (real run 2026-09-29).
    return this.page
      .locator('div.mt-4.animate-comein')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('p')
      .nth(1);
  }

  /** Success pop-up after "Update Attendance": a check icon + text and only a close (×). */
  attendanceSuccessPopup() {
    return this.page.locator('.ant-modal').filter({ hasText: 'Attendance updated successfully!' });
  }
}
