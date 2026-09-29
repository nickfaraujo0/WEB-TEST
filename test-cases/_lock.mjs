// @ts-check
import fs from 'fs';
import os from 'os';
import path from 'path';
import { test } from '@playwright/test';

/**
 * Cross-process lock for tests that share one piece of real app state (one account's follow
 * list, one division's "now" time slot, …). Playwright runs workers — and each browser project —
 * as separate processes, so an in-memory flag can't do this; a directory is created atomically
 * by the OS, which makes `mkdir` a reliable lock. Everything that doesn't hold the lock keeps
 * running in parallel as normal.
 *
 * The waiting test's timeout is extended by `extraTimeoutMs` so time spent queueing for the lock
 * doesn't count against its own budget. A holder that crashed is ignored after `staleMs`.
 */
export async function withLock(name, fn, { staleMs = 5 * 60 * 1000, extraTimeoutMs = 6 * 60 * 1000 } = {}) {
  try {
    test.info().setTimeout(test.info().timeout + extraTimeoutMs);
  } catch (e) {
    // not inside a running test — nothing to extend
  }
  const dir = path.join(os.tmpdir(), `hive-lock-${name}`);
  for (;;) {
    try {
      fs.mkdirSync(dir);
      break;
    } catch (e) {
      if (/** @type {any} */ (e).code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(dir).mtimeMs > staleMs) fs.rmdirSync(dir);
      } catch (err) {} // another process removed or re-took it in between — just retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  try {
    return await fn();
  } finally {
    try {
      fs.rmdirSync(dir);
    } catch (e) {}
  }
}
