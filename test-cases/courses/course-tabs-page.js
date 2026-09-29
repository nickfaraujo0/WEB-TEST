// @ts-check
import fs from 'fs';
import { expect } from '../_hive-live.mjs';
import { CoursesPage } from './courses-page.js';
import { withLock } from '../_lock.mjs';

/**
 * Page object for the Courses list extras (Even/Odd, On-Duty check-in, course feedback) and a
 * course's other sub-tabs (Students, Messages, Feedback, Resources, Assessments, Course Info) —
 * sheet "Courses – List & Course Tabs (Web)". Everything here was confirmed live 2026-09-29.
 */

/** Professor fixture: a division with no students and no sessions, but with assessments. */
export const DSA_ASSESSMENT = { course: 'Data Structures and Algorithms', division: 'Assessment test', code: 'DSA-123' };

const PDF_FIXTURE = new URL('../buzz/fixtures/small-test.pdf', import.meta.url);

export class CourseTabsPage extends CoursesPage {
  /**
   * A course sub-tab pill (Students, Messages, …). An unscoped getByText('Messages') also hits
   * the app's left nav "Messages" link, so match the pill div itself.
   */
  subTab(name) {
    return this.page.locator('div.rounded-full.cursor-pointer', { hasText: new RegExp(`^${name}$`) });
  }

  /** Sub-tab group heading ("Teach", "Drive Engagement", "Evaluate" / student: "Learn", "Engage"). */
  subTabGroup(label) {
    return this.page.locator('div.text-sm.mb-2.text-gray-500', { hasText: new RegExp(`^${label}$`) });
  }

  async openSubTab(name) {
    await this.subTab(name).click();
  }

  // ---- Courses list ----
  semesterPill(name) {
    return this.page.getByText(name, { exact: true });
  }
  onDutyButton() {
    return this.page.getByText('Check in On-Duty Students', { exact: true });
  }
  submitFeedbackButton() {
    return this.page.getByText('Submit Course Feedback', { exact: true });
  }

  // ---- ant modals: every dialog here closes with a rotated "+" in its header ----
  modal(title) {
    return this.page.locator('.ant-modal-content').filter({ hasText: title });
  }
  /** antd's own close button sits on top of the header's "+" and intercepts clicks on it. */
  modalClose(title) {
    return this.modal(title).locator('button.ant-modal-close');
  }

  // ---- On-Duty check-in ----
  onDutyDialog() {
    return this.modal('Check In On-Duty Students');
  }
  eventTypePill(name) {
    return this.onDutyDialog().getByRole('button', { name, exact: true });
  }
  /** The selected event type pill turns `bg-subtleBlue`. */
  async isEventTypeSelected(name) {
    return ((await this.eventTypePill(name).getAttribute('class')) || '').includes('bg-subtleBlue');
  }
  onDutyDateInputs() {
    return this.onDutyDialog().getByPlaceholder('Select date');
  }
  onDutyEventName() {
    return this.onDutyDialog().getByPlaceholder(/Enter Name\/Description of the event/);
  }
  onDutyNext() {
    return this.onDutyDialog().getByRole('button', { name: 'Next', exact: true });
  }

  // ---- Course feedback (student) ----
  feedbackRow(course) {
    return this.page.locator('div.group.rounded-2xl.cursor-pointer').filter({ has: this.page.getByText(course, { exact: true }) });
  }

  // ---- Course Info / Course Settings ----
  courseSettings() {
    return this.modal('Course Settings');
  }
  courseTypeRadio(name) {
    return this.courseSettings().locator(`input.ant-radio-input[value="${name}"]`);
  }
  descriptionInput() {
    return this.courseSettings().getByPlaceholder('Enter description here...');
  }
  viewButton(index) {
    return this.courseSettings().getByText('View', { exact: true }).nth(index);
  }
  settingsSaveButton() {
    return this.courseSettings().getByText('Save Changes', { exact: true });
  }

  // ---- Students ----
  addStudentsButton() {
    return this.page.getByText('Add Students', { exact: true }).first();
  }
  addStudentsDialog(division) {
    return this.modal(`Add Students to ${division}`);
  }
  participantSearch() {
    return this.page.getByPlaceholder(/roll no/i);
  }

  // ---- Resources ----
  uploadLocalButton() {
    return this.page.getByText('Upload Local Files (10 MB)', { exact: true });
  }
  uploadDriveButton() {
    return this.page.getByText('Upload From Google Drive', { exact: true });
  }
  resourceName(name) {
    return this.page.getByText(name, { exact: true });
  }
  /** The file row: the smallest block holding both the name and its red delete button. */
  resourceRow(name) {
    return this.page.locator('div').filter({ has: this.resourceName(name) }).filter({ has: this.page.locator('div.text-red-600') }).last();
  }
  async uploadFile(file) {
    const chooser = this.page.waitForEvent('filechooser');
    await this.uploadLocalButton().click();
    await (await chooser).setFiles(file);
  }
  async deleteResource(name) {
    await this.resourceRow(name).locator('div.text-red-600').click();
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Are you sure you want to delete this file?' });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(this.resourceName(name)).toHaveCount(0, { timeout: 20000 });
  }

  // ---- Assessments ----
  assessmentCards() {
    return this.page.getByText(/^Internal Tests • Total Marks|• Total Marks/);
  }
}

/** Opens a course (and division) with the extended page object. */
export async function openCourseTabs(page, course, division) {
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.openCourse(course);
  await tabs.tabPill('Schedule/Lesson Plan').waitFor({ state: 'visible', timeout: 20000 });
  if (division) await tabs.divisionTab(division).click();
  return tabs;
}

/** Student: the course card on "Your courses" is titled by division ("Div A" = ME101). */
export async function openStudentCourse(page, card = 'Div A') {
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await page.getByText(card, { exact: true }).first().click();
  await tabs.tabPill('Schedule/Lesson Plan').waitFor({ state: 'visible', timeout: 30000 });
  return tabs;
}

/** A uniquely named copy of the small PDF fixture, so parallel runs never clash on names. */
export function qaPdf(sizeBytes) {
  const buffer = sizeBytes ? Buffer.alloc(sizeBytes, 0x20) : fs.readFileSync(PDF_FIXTURE);
  return { name: `qa-${Date.now()}-${Math.floor(Math.random() * 1e4)}.pdf`, mimeType: 'application/pdf', buffer };
}

/**
 * Uploads a throwaway file to the current division's Resources, runs `fn(name)`, and always
 * deletes it. Serialised: every Resources test shares the one "Assessment test" division.
 */
export async function withQaResource(tabs, fn) {
  return withLock('courses-resources', async () => {
    const file = qaPdf();
    await tabs.uploadFile(file);
    await expect(tabs.resourceName(file.name)).toBeVisible({ timeout: 60000 });
    try {
      return await fn(file.name);
    } finally {
      await tabs.deleteResource(file.name).catch(() => {});
    }
  });
}
