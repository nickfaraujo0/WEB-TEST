// @ts-check

/**
 * Test accounts for the Hive web login suite (https://hive-dev.thegritcity.com).
 *
 * `nolan@wafer.ee` is the same throwaway dev-build faculty account the DroidSwarm Appium
 * suite signs in with (tests/appium/credentials.mjs in the DroidSwarmQAgent-Knowledge repo) —
 * confirmed live against the web login on 2026-09-11.
 *
 * The environment always wins: set these as real env vars to override the fallback below
 * without editing this file.
 */
const FALLBACKS = Object.freeze({
  HIVE_VALID_EMAIL: 'nolan@wafer.ee',
  HIVE_VALID_PASSWORD: 'nolan123',

  // Deliberately wrong, for TC002 (Invalid Password).
  HIVE_INVALID_PASSWORD: 'WrongPassword@999',

  // Well-formed but not a registered account, for TC003 (Invalid Email).
  HIVE_UNREGISTERED_EMAIL: 'nonexistentuser999@wafer.ee',

  // Malformed (no '@'), for TC007 (Invalid Email Format).
  HIVE_MALFORMED_EMAIL: 'nolanwaferee',

  // A second, enrolled student — the counterpart to nolan@wafer.ee (a Professor) needed for
  // role-based tests in the Opportunities suite (e.g. only professors can create listings).
  // Same throwaway-account source as HIVE_VALID_EMAIL: tests/appium/credentials.mjs.
  HIVE_STUDENT_EMAIL: 'student0003@test.com',
  HIVE_STUDENT_PASSWORD: 'Stud@123',
});

/** One credential, by name. Throws for a name nobody defined. */
export function credential(name) {
  const fromEnv = process.env[name];
  if (fromEnv !== undefined && fromEnv !== '') {
    return fromEnv;
  }

  const fallback = FALLBACKS[name];
  if (fallback === undefined) {
    throw new Error(`No credential named ${name}. Add it to tests/web/login/credentials.js.`);
  }

  return fallback;
}
