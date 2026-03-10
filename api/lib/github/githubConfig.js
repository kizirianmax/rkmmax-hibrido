/**
 * GITHUB INTEGRATION CONFIG
 *
 * Reads env vars and exposes the feature flag + credential helpers.
 *
 * Feature flag: GITHUB_INTEGRATION_ENABLED
 *   - "false" (default) → all GitHub functionality is disabled; endpoints return 501.
 *   - "true"            → integration is active; requires credentials below.
 *
 * Auth modes (future):
 *   - "stub"  → No real HTTP calls; returns mock data. Good for local dev.
 *   - "oauth" → Uses a user-level OAuth token (GITHUB_TOKEN).
 *   - "app"   → Uses a GitHub App installation token (preferred for production).
 *               TODO: implement GitHub App installation flow.
 *
 * TODO (GitHub App path):
 *   1. Create GitHub App installation flow (/api/github/app/install)
 *   2. Implement OAuth callback to receive installation_id
 *   3. Store installation_id per user/workspace
 *   4. Generate per-installation JWT → exchange for installation token
 */

/** @returns {boolean} Whether GitHub integration is enabled */
export function isGithubEnabled() {
  return process.env.GITHUB_INTEGRATION_ENABLED === "true";
}

/**
 * Resolves the active auth mode.
 * @returns {"stub"|"oauth"|"app"}
 */
export function getAuthMode() {
  const mode = process.env.GITHUB_AUTH_MODE || "stub";
  if (mode === "app" || mode === "oauth" || mode === "stub") return mode;
  return "stub";
}

/**
 * Returns the OAuth token from env, or null if not set.
 * Never logs or exposes the raw value.
 * @returns {string|null}
 */
export function getOAuthToken() {
  return process.env.GITHUB_TOKEN || null;
}

/**
 * Checks whether the minimum credentials for the current auth mode are present.
 * @returns {{ ok: boolean, reason: string|null }}
 */
export function checkCredentials() {
  const mode = getAuthMode();

  if (mode === "stub") {
    return { ok: true, reason: null };
  }

  if (mode === "oauth") {
    if (!process.env.GITHUB_TOKEN) {
      return { ok: false, reason: "GITHUB_TOKEN is not set" };
    }
    return { ok: true, reason: null };
  }

  if (mode === "app") {
    // TODO: validate GitHub App credentials (APP_ID, PRIVATE_KEY, INSTALLATION_ID)
    return { ok: false, reason: "GitHub App auth not yet implemented (TODO)" };
  }

  return { ok: false, reason: `Unknown auth mode: ${mode}` };
}

/**
 * Full config snapshot — safe to log (no secrets).
 * @returns {object}
 */
export function getGithubConfigStatus() {
  return {
    enabled: isGithubEnabled(),
    mode: getAuthMode(),
    hasOAuthToken: !!process.env.GITHUB_TOKEN,
    hasAppId: !!process.env.GITHUB_APP_ID,
    hasPrivateKey: !!process.env.GITHUB_APP_PRIVATE_KEY,
  };
}
