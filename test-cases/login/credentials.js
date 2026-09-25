// @ts-check

/**
 * Test accounts for the Hive web suites (https://hive-dev.thegritcity.com).
 *
 * Real account emails and passwords are NOT in this file — they come from environment
 * variables, normally set in the repo-root `.env` (git-ignored; `playwright.config.js` loads it).
 * Copy `.env.example` to `.env` and fill it in. The main faculty account is the same
 * throwaway dev-build account the DroidSwarm Appium suite signs in with.
 *
 * Only values that are deliberately fake (a wrong password, an unregistered or malformed
 * email) live here as defaults, and the environment still wins over them.
 */
const NON_SECRET_DEFAULTS = Object.freeze({
  // Deliberately wrong, for TC002 (Invalid Password).
  HIVE_INVALID_PASSWORD: 'WrongPassword@999',

  // Well-formed but not a registered account, for TC003 (Invalid Email).
  HIVE_UNREGISTERED_EMAIL: 'nonexistentuser999@wafer.ee',

  // Malformed (no '@'), for TC007 (Invalid Email Format).
  HIVE_MALFORMED_EMAIL: 'nolanwaferee',
});

/** Account credentials that must come from the environment / `.env`. */
const FROM_ENV_ONLY = new Set([
  'HIVE_VALID_EMAIL',
  'HIVE_VALID_PASSWORD',
  'HIVE_STUDENT_EMAIL',
  'HIVE_STUDENT_PASSWORD',
  'HIVE_PROFESSOR2_EMAIL',
  'HIVE_PROFESSOR2_PASSWORD',
  'HIVE_DEACTIVATED_EMAIL',
  'HIVE_DEACTIVATED_PASSWORD',
]);

/** One credential, by name. Throws for a name nobody defined or a missing account variable. */
export function credential(name) {
  const fromEnv = process.env[name];
  if (fromEnv !== undefined && fromEnv !== '') {
    return fromEnv;
  }

  if (FROM_ENV_ONLY.has(name)) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env in the repo root and fill in the Hive test accounts.`
    );
  }

  const fallback = NON_SECRET_DEFAULTS[name];
  if (fallback === undefined) {
    throw new Error(`No credential named ${name}. Add it to test-cases/login/credentials.js or .env.example.`);
  }

  return fallback;
}
