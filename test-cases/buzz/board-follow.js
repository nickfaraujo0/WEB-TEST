// @ts-check
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from '@playwright/test';

/** Follow/Unfollow helpers for the button at the top right of a /Buzz/Board/<id> page. */
export function followButton(page) {
  return page.getByRole('button', { name: /^(Follow|Unfollow)$/ });
}

// Relative, so it follows the environment picked on the dashboard (Playwright's baseURL).
export const TPO_BOARD_URL = '/Buzz/Board/8tRCj2foMkl3i3rycE50';

/**
 * Opens the TPO board page directly. Reaching it by clicking a feed label (TC043) stops
 * working as soon as newer, unlabelled posts push every TPO post off the first feed page —
 * which the suite's own throwaway posts eventually do — so follow tests go by URL instead.
 */
export async function openTpoBoard(page) {
  await page.goto(TPO_BOARD_URL, { waitUntil: 'domcontentloaded' });
  await expect(followButton(page)).toBeVisible({ timeout: 15000 });
}

/** Leaves the student following nothing, so tests that need a clean start (and leave one) are repeatable. */
export async function ensureUnfollowed(page) {
  const btn = followButton(page);
  if ((await btn.innerText()).trim() === 'Unfollow') {
    await btn.click();
    await expect(btn).toHaveText('Follow');
  }
}

// TC044–TC046 all follow/unfollow TPO on the same student account, so two of them running at
// once (parallel workers, or the same test in Chromium and Firefox) flip each other's state
// mid-assertion. This lock makes them take turns. It's a directory in the OS temp folder
// because mkdir is atomic across the separate worker processes Playwright spawns.
const LOCK_DIR = path.join(os.tmpdir(), 'hive-buzz-student-follow.lock');
const LOCK_STALE_MS = 3 * 60 * 1000; // a crashed holder never blocks the others for long

/** Budget for a test that waits on the lock: other holders' runs plus its own. */
export const FOLLOW_LOCK_TEST_TIMEOUT = 6 * 60 * 1000;

export async function withStudentFollowLock(fn) {
  for (;;) {
    try {
      fs.mkdirSync(LOCK_DIR);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(LOCK_DIR).mtimeMs > LOCK_STALE_MS) fs.rmdirSync(LOCK_DIR);
      } catch (err) {} // another worker removed or re-took it in between — just retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  try {
    return await fn();
  } finally {
    try {
      fs.rmdirSync(LOCK_DIR);
    } catch (e) {}
  }
}
