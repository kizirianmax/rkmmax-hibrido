/**
 * GITHUB HTTP CLIENT
 *
 * Thin wrapper around Node's built-in fetch (available Node ≥ 18; project uses Node 22).
 * Provides: baseUrl, standard headers, configurable timeout, simple retry on 5xx/network errors,
 * and consistent error handling that never leaks tokens into logs.
 *
 * Usage:
 *   import { githubFetch } from './githubClient.js';
 *   const data = await githubFetch('/repos/owner/repo', { token });
 */

const GITHUB_API_BASE = "https://api.github.com";
const DEFAULT_TIMEOUT_MS = 8_000; // ≤ Vercel's 8 s serverless limit
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

/**
 * @typedef {Object} GitHubFetchOptions
 * @property {string}  [token]       - Bearer token (never logged)
 * @property {string}  [method]      - HTTP method (default: "GET")
 * @property {object}  [body]        - Request body (will be JSON-serialised)
 * @property {number}  [timeoutMs]   - Override per-request timeout
 * @property {number}  [maxRetries]  - Override retry count (0 = no retry)
 */

/**
 * Makes an authenticated request to the GitHub REST API.
 *
 * @param {string}            path    - API path, e.g. "/repos/owner/repo/contents/file"
 * @param {GitHubFetchOptions} [opts]
 * @returns {Promise<unknown>} Parsed JSON response body
 * @throws {GitHubApiError}
 */
export async function githubFetch(path, opts = {}) {
  const {
    token,
    method = "GET",
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = opts;

  const url = `${GITHUB_API_BASE}${path}`;

  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RKMMAX-Construtor/1.0",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
  };

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Retry on server errors (429, 5xx)
      if (response.status === 429 || (response.status >= 500 && attempt < maxRetries)) {
        lastError = new GitHubApiError(
          `GitHub API returned ${response.status}`,
          response.status,
          path
        );
        continue;
      }

      if (!response.ok) {
        const errorBody = await safeJson(response);
        throw new GitHubApiError(
          errorBody?.message || `GitHub API error ${response.status}`,
          response.status,
          path
        );
      }

      // 204 No Content
      if (response.status === 204) return null;

      return await response.json();
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof GitHubApiError) throw err; // non-retryable API error

      // Network / abort / timeout
      lastError = new GitHubApiError(
        err.name === "AbortError" ? `GitHub API request timed out (${timeoutMs}ms)` : err.message,
        0,
        path
      );

      if (attempt >= maxRetries) throw lastError;
    }
  }

  throw lastError;
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class GitHubApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status  - HTTP status code (0 = network/timeout)
   * @param {string} path    - API path that was called
   */
  constructor(message, status, path) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.path = path;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
