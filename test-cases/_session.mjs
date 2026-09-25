// @ts-check
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@playwright/test';
import { LoginPage } from './login/login-page.js';
import { credential } from './login/credentials.js';

/**
 * Logged-in sessions, reused across tests instead of filling in the login form every time.
 *
 * Hive signs in with Firebase, which keeps the session in IndexedDB (`firebaseLocalStorageDb`)
 * plus a few app keys in localStorage. Playwright's `storageState` option can only load that
 * into a brand-new context, and these tests receive an already-open `page`, so instead the
 * first login per role goes through the real form, the result is saved to `.auth/`, and later
 * tests write it back into the browser on a stub page at the app's origin (served by
 * `page.route`, so the 7.6MB app bundle never loads for it) before opening /Buzz.
 *
 * Anything unexpected (no saved session, expired, restore didn't sign in) falls back to the
 * real login form and refreshes the saved copy, so a stale cache can cost time but never fail
 * a test.
 */

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUTH_DIR = path.join(ROOT, '.auth');
// Firebase ID tokens last an hour and the SDK refreshes them itself; re-login well before that.
const MAX_AGE_MS = 30 * 60 * 1000;
const SEED_PATH = '/__hive_session_seed__';
const AUTH_DB = 'firebaseLocalStorageDb';

const ROLES = {
  professor: { email: 'HIVE_VALID_EMAIL', password: 'HIVE_VALID_PASSWORD' },
  student: { email: 'HIVE_STUDENT_EMAIL', password: 'HIVE_STUDENT_PASSWORD' },
  professor2: { email: 'HIVE_PROFESSOR2_EMAIL', password: 'HIVE_PROFESSOR2_PASSWORD' },
};

function cacheFile(role) {
  return path.join(AUTH_DIR, role + '.json');
}

function readCache(role) {
  try {
    const saved = JSON.parse(fs.readFileSync(cacheFile(role), 'utf8'));
    if (Date.now() - saved.savedAt > MAX_AGE_MS) return null;
    return saved;
  } catch (e) {
    return null;
  }
}

/**
 * Reads the signed-in session straight out of the page. Playwright's own
 * `storageState({ indexedDB: true })` returns these records in its encoded form
 * (`valueEncoded`), which can't be written back from page code, whereas Firebase's records are
 * plain JSON objects when read with IndexedDB's own API.
 */
async function writeCache(role, page) {
  const origin = new URL(page.url()).origin;
  const snapshot = await page.evaluate(async (dbName) => {
    const conn = await new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const stores = [];
    for (const name of Array.from(conn.objectStoreNames)) {
      const store = conn.transaction(name, 'readonly').objectStore(name);
      const records = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result.map((value) => ({ value })));
        req.onerror = () => reject(req.error);
      });
      stores.push({ name, keyPath: store.keyPath, autoIncrement: store.autoIncrement, indexes: [], records });
    }
    const db = { name: dbName, version: conn.version, stores };
    conn.close();
    const localStorageItems = Object.keys(localStorage).map((name) => ({ name, value: localStorage.getItem(name) }));
    return { db, localStorageItems };
  }, AUTH_DB);
  // Nothing signed in to save (e.g. the app changed how it stores the session).
  if (!snapshot.db.stores.some((s) => s.records.length)) return;
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  // Write-then-rename so a parallel worker never reads a half-written file.
  const tmp = cacheFile(role) + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ savedAt: Date.now(), origin, localStorage: snapshot.localStorageItems, db: snapshot.db }));
  fs.renameSync(tmp, cacheFile(role));
}

async function loginWithForm(page, role) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(credential(ROLES[role].email), credential(ROLES[role].password));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
}

/** Writes a saved session into the browser, then opens /Buzz. Resolves true if signed in. */
async function restoreSession(page, saved) {
  const seedUrl = saved.origin + SEED_PATH;
  await page.route(seedUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>seed</title>' }));
  try {
    await page.goto(seedUrl);
    await page.evaluate(async ({ localStorageItems, db }) => {
      localStorage.clear();
      localStorageItems.forEach((item) => localStorage.setItem(item.name, item.value));
      await new Promise((resolve, reject) => {
        const req = indexedDB.open(db.name, db.version);
        req.onupgradeneeded = () => {
          db.stores.forEach((s) => {
            if (req.result.objectStoreNames.contains(s.name)) return;
            const store = req.result.createObjectStore(s.name, { keyPath: s.keyPath, autoIncrement: s.autoIncrement });
            (s.indexes || []).forEach((ix) => store.createIndex(ix.name, ix.keyPath, { unique: ix.unique, multiEntry: ix.multiEntry }));
          });
        };
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const conn = req.result;
          const tx = conn.transaction(db.stores.map((s) => s.name), 'readwrite');
          db.stores.forEach((s) => {
            const store = tx.objectStore(s.name);
            s.records.forEach((r) => (s.keyPath ? store.put(r.value) : store.put(r.value, r.key)));
          });
          tx.oncomplete = () => {
            conn.close();
            resolve(undefined);
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    }, { localStorageItems: saved.localStorage, db: saved.db });
  } finally {
    await page.unroute(seedUrl);
  }

  await page.goto(saved.origin + '/Buzz', { waitUntil: 'domcontentloaded' });
  // Signed in: the feed renders. Signed out: the app sends us to the login form instead.
  const feed = page.locator('.infinite-scroll-component');
  const loginForm = page.getByPlaceholder('Email');
  await expect(feed.or(loginForm).first()).toBeVisible({ timeout: 30000 });
  return (await feed.isVisible()) && /\/Buzz/i.test(page.url());
}

async function loginAs(page, role) {
  const saved = readCache(role);
  if (saved && (await restoreSession(page, saved).catch(() => false))) return;
  await loginWithForm(page, role);
  await writeCache(role, page).catch(() => {});
}

/** Leaves `page` signed in as the professor account, on /Buzz. */
export async function loginAsProfessor(page) {
  await loginAs(page, 'professor');
}

/** Leaves `page` signed in as the student account, on /Buzz. */
export async function loginAsStudent(page) {
  await loginAs(page, 'student');
}

/** Leaves `page` signed in as the second Professor account (not the author of the main account's posts), on /Buzz. */
export async function loginAsProfessor2(page) {
  await loginAs(page, 'professor2');
}
