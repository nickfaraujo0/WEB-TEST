// @ts-check

export const PROFILE_URL = 'https://hive-dev.thegritcity.com/profile';

/**
 * Page object for the Hive web Profile page (/profile).
 * Unlike the Android app, web has a single 11-field form shared by professors and students,
 * with an "Edit" button (no header pencil icon) and a "Change Password" button.
 * Two fields share the "Select date" placeholder: Date of Birth (first) and Joining Year (second).
 */
export class ProfilePage {
  constructor(page) {
    this.page = page;
    this.editButton = page.getByRole('button', { name: 'Edit' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.changePasswordButton = page.getByRole('button', { name: 'Change Password' });
    this.inputs = page.locator('input');
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.displayName = page.getByPlaceholder('Display Name');
    this.email = page.getByPlaceholder('Email');
    this.phone = page.getByPlaceholder('Phone');
    this.enrollment = page.getByPlaceholder('Enrollment No.');
    this.college = page.getByPlaceholder('College Name');
    this.department = page.getByPlaceholder('Department');
    this.dateInputs = page.getByPlaceholder('Select date');
    this.resetDialog = page.getByRole('dialog');
  }

  async goto() {
    await this.page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await this.editButton.waitFor();
  }

  /** Placeholders of every input that is currently enabled (editable). */
  async enabledPlaceholders() {
    return this.inputs.evaluateAll((els) => els.filter((e) => !e.disabled).map((e) => e.placeholder));
  }
}
