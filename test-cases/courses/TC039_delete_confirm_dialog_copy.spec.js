// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

/** A real run showed the antd modal wrapper (`.ant-modal-wrap`) can still intercept pointer
 * events for a moment after clicking Cancel — its close animation lags behind the dialog
 * itself reporting hidden — which then blocked `withDisposableSession`'s own cleanup click on
 * the card's "..." menu. Waiting for the dialog to actually be hidden before returning avoids
 * that race. */
test('TC039 - Verify the Delete Session confirm dialog\'s exact copy and buttons', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Delete Session').click();

    const dialog = courses.deleteConfirmDialog();
    await expect(dialog.getByText('Delete this session?', { exact: true })).toBeVisible();
    await expect(dialog.getByText('This will permanently remove the session. This action cannot be undone.', { exact: true })).toBeVisible();
    await expect(courses.deleteCancelButton()).toBeVisible();
    await expect(courses.deleteConfirmButton()).toBeVisible();
    await courses.deleteCancelButton().click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});
