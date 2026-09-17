// @ts-check

export const LOGIN_URL = 'https://hive-dev.thegritcity.com/login';

/**
 * Page object for the Hive login screen.
 *
 * A failed login (wrong password, unregistered email, etc.) shows an antd `Modal.confirm`
 * error dialog titled "Login Failed" with the body text "Invalid email or password" — the
 * app does not distinguish between a bad password and an unrecognized email, both produce
 * the same Firebase `auth/invalid-credential` response and the same generic dialog.
 */
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.errorDialog = page.getByRole('dialog');
  }

  async goto() {
    await this.page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
