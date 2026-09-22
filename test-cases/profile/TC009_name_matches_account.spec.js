// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';
import { loginAs, STUDENT } from './profile-helpers.js';

/**
 * Web-only. Confirmed live: the page heading shows the account's first name, and the Email
 * field shows the address that was used to log in — for both a professor and a student.
 */
test.describe('TC009 - Profile shows the logged-in account', () => {
  test('TC009-Professor', async ({ page }) => {
    await loginAs(page);
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.email).toHaveValue(credential('HIVE_VALID_EMAIL'));
    const first = await profile.firstName.inputValue();
    expect(first).not.toBe('');
    await expect(page.getByText(first, { exact: true }).first()).toBeVisible();
  });

  test('TC009-Student', async ({ page }) => {
    await loginAs(page, ...STUDENT);
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.email).toHaveValue(credential('HIVE_STUDENT_EMAIL'));
    const first = await profile.firstName.inputValue();
    expect(first).not.toBe('');
    await expect(page.getByText(first, { exact: true }).first()).toBeVisible();
  });
});
