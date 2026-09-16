// @ts-check

/**
 * Simulates a revoked/expired session for TC009 (Login Session Expiry).
 *
 * The spreadsheet's step "revoke the token" is a backend/admin action (e.g. Firebase Admin's
 * `revokeRefreshTokens`) that this suite has no credentials to perform for real — the same
 * kind of gap documented in TC008. The client-observable effect of a revoked token is the
 * same either way: the browser's stored refresh token stops working. So this corrupts the
 * Firebase Auth session Playwright already has in IndexedDB (`firebaseLocalStorageDb`,
 * store `firebaseLocalStorage`) directly, which reproduces the same
 * `auth/invalid-refresh-token` failure a real revocation produces on the next token refresh.
 *
 * Must run after a real login (the record has to exist first).
 */
export async function corruptStoredAuthToken(page) {
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const tx = db.transaction('firebaseLocalStorage', 'readwrite');
    const store = tx.objectStore('firebaseLocalStorage');
    const records = await new Promise((resolve, reject) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });

    if (records.length === 0) {
      throw new Error('No Firebase auth record found in IndexedDB — was the login step run first?');
    }

    const record = records[0];
    record.value.stsTokenManager.accessToken = 'revoked.invalid.token';
    record.value.stsTokenManager.refreshToken = 'revoked-invalid-refresh-token';
    record.value.stsTokenManager.expirationTime = Date.now() - 60 * 60 * 1000;

    await new Promise((resolve, reject) => {
      const r = store.put(record);
      r.onsuccess = () => resolve(undefined);
      r.onerror = () => reject(r.error);
    });
  });
}
