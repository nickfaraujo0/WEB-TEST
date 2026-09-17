// @ts-check

export const SIGNUP_URL = 'https://hive-dev.thegritcity.com/signup';
export const LOGIN_URL = 'https://hive-dev.thegritcity.com/login';

/**
 * Page object for the Hive web sign-up screen (https://hive-dev.thegritcity.com/signup).
 *
 * This is NOT the flow the Onboarding_Test_Cases spreadsheet describes — that spreadsheet
 * documents a multi-step mobile wizard (college select -> role-based form -> email step ->
 * password step -> verification step). The actual web page is a single-step form: Full Name,
 * Email, Password, Confirm Password, a consent checkbox, and one submit button (labelled
 * "Sign in", apparently a copy-paste label bug, not "Sign up"). There is no college dropdown,
 * no role dropdown, and no per-step "Next" button anywhere on web.
 *
 * It's also not linked from the login page in any viewport (desktop or mobile) — reaching it
 * means navigating to /signup directly.
 */
export class SignupPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByPlaceholder('Full Name');
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('Set up a password');
    this.confirmPasswordInput = page.getByPlaceholder('Confirm your password');
    this.consentCheckbox = page.locator('input[type="checkbox"]');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.loginNowLink = page.getByRole('link', { name: 'Log in now' });
    this.errorDialog = page.getByRole('dialog');
  }

  async goto() {
    await this.page.goto(SIGNUP_URL, { waitUntil: 'domcontentloaded' });
  }

  async fill({ name, email, password, confirmPassword }) {
    if (name !== undefined) await this.nameInput.fill(name);
    if (email !== undefined) await this.emailInput.fill(email);
    if (password !== undefined) await this.passwordInput.fill(password);
    if (confirmPassword !== undefined) await this.confirmPasswordInput.fill(confirmPassword);
  }
}
