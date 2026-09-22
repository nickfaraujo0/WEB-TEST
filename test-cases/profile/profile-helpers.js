// @ts-check
import { expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';

/** Log in with the named credentials (default: the professor account) and wait for Buzz. */
export async function loginAs(page, emailKey = 'HIVE_VALID_EMAIL', passwordKey = 'HIVE_VALID_PASSWORD') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential(emailKey), credential(passwordKey));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
}

export const STUDENT = ['HIVE_STUDENT_EMAIL', 'HIVE_STUDENT_PASSWORD'];
export const PROFESSOR2 = ['HIVE_PROFESSOR2_EMAIL', 'HIVE_PROFESSOR2_PASSWORD'];

/**
 * The top-right account menu (opened by clicking the header avatar) that holds the user's
 * name, email and Logout. The avatar has no alt text or role, so it is found by position:
 * the image in the header's right half.
 */
export class AccountMenu {
  constructor(page) {
    this.page = page;
    this.logoutItem = page.getByText('Logout', { exact: true });
    this.confirmDialog = page.getByRole('dialog');
    this.noButton = page.getByRole('button', { name: 'No' });
    this.yesButton = page.getByRole('button', { name: 'Yes' });
  }

  async open() {
    /** @type {{x:number,y:number}|null} */
    let point = null;
    await expect.poll(async () => {
      point = await this.page.evaluate(() => {
        const img = [...document.querySelectorAll('img')].find((i) => {
          const r = i.getBoundingClientRect();
          return r.top < 60 && r.left > window.innerWidth / 2 && r.width > 0;
        });
        if (!img) return null;
        const r = img.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      return point !== null;
    }, { timeout: 20000 }).toBe(true);
    await this.page.mouse.click(point.x, point.y);
    await this.logoutItem.waitFor();
  }
}
