// @ts-check

export const FORGOT_PASSWORD_URL = 'https://hive-dev.thegritcity.com/forgotPassword';

/**
 * Page object for the "Forgot Password" screen reached from the login page.
 * A successful submit shows an antd `Modal.success` dialog: "Reset email sent successfully."
 */
export class ForgotPasswordPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Email');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.confirmationDialog = page.getByRole('dialog');
  }

  async submit(email) {
    await this.emailInput.fill(email);
    await this.nextButton.click();
  }
}
