/**
 * GITHUB INTEGRATION ENDPOINTS
 *
 * Routes:
 *   GET /api/github/status  → { enabled, mode, message }
 *   GET /api/github/repos   → array of GithubRepo (or error)
 *
 * All GitHub functionality is gated behind GITHUB_INTEGRATION_ENABLED=true.
 * When the flag is false every endpoint other than /status returns 501.
 *
 * Security:
 *   - No secrets are logged or included in error responses.
 *   - Inputs are validated before being forwarded to the service layer.
 *   - Stack traces are never sent to the client.
 */

import {
  isGithubEnabled,
  getAuthMode,
  getOAuthToken,
  checkCredentials,
} from "./lib/github/githubConfig.js";
import { listRepos } from "./lib/github/githubService.js";
import { GitHubApiError } from "./lib/github/githubClient.js";
import { NotImplementedError } from "./lib/github/githubService.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Set standard headers and return the response object for chaining. */
function prepare(res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  // Only allow same-origin calls in production; relax for local dev via env
  const origin = process.env.GITHUB_CORS_ORIGIN || "https://kizirianmax.site";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

/** Send a safe error — never includes stack trace or raw secret values. */
function sendError(res, status, code, message) {
  return prepare(res).status(status).json({ error: { code, message } });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return prepare(res).status(204).end();
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Only GET requests are accepted");
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // ── GET /api/github/status ─────────────────────────────────────────────────
  if (pathname === "/api/github/status") {
    const enabled = isGithubEnabled();
    const mode = getAuthMode();

    let message;
    if (!enabled) {
      message = "GitHub integration is disabled (set GITHUB_INTEGRATION_ENABLED=true to enable)";
    } else {
      const creds = checkCredentials();
      message = creds.ok
        ? `Integration active in '${mode}' mode`
        : `Integration enabled but credentials missing: ${creds.reason}`;
    }

    return prepare(res).status(200).json({
      enabled,
      mode,
      message,
    });
  }

  // ── GET /api/github/repos ──────────────────────────────────────────────────
  if (pathname === "/api/github/repos") {
    if (!isGithubEnabled()) {
      return sendError(
        res,
        501,
        "INTEGRATION_DISABLED",
        "GitHub integration is disabled. Set GITHUB_INTEGRATION_ENABLED=true to enable."
      );
    }

    const creds = checkCredentials();
    if (!creds.ok) {
      return sendError(res, 400, "CREDENTIALS_MISSING", creds.reason);
    }

    if (getAuthMode() === "stub") {
      // Return mock data in stub mode so the UI can be built without real credentials
      return prepare(res).status(200).json(STUB_REPOS);
    }

    const token = getOAuthToken();
    if (!token) {
      return sendError(res, 401, "UNAUTHENTICATED", "No GitHub token available");
    }

    try {
      const repos = await listRepos(token);
      return prepare(res).status(200).json(repos);
    } catch (err) {
      return handleServiceError(res, err);
    }
  }

  // ── 404 ────────────────────────────────────────────────────────────────────
  return sendError(res, 404, "NOT_FOUND", "Unknown GitHub endpoint. Available: GET /api/github/status, GET /api/github/repos");
}

// ─── Error handling ───────────────────────────────────────────────────────────

function handleServiceError(res, err) {
  if (err instanceof NotImplementedError) {
    return sendError(res, 501, "NOT_IMPLEMENTED", err.message);
  }
  if (err instanceof GitHubApiError) {
    // Map GitHub API errors to safe client messages
    if (err.status === 401 || err.status === 403) {
      return sendError(res, err.status, "GITHUB_AUTH_ERROR", "GitHub authentication failed");
    }
    if (err.status === 404) {
      return sendError(res, 404, "GITHUB_NOT_FOUND", "GitHub resource not found");
    }
    if (err.status === 429) {
      return sendError(res, 429, "GITHUB_RATE_LIMITED", "GitHub API rate limit exceeded");
    }
    if (err.status >= 500 || err.status === 0) {
      return sendError(res, 502, "GITHUB_UPSTREAM_ERROR", "GitHub API is temporarily unavailable");
    }
    return sendError(res, 400, "GITHUB_API_ERROR", err.message);
  }
  // Unknown — log server-side but don't leak details
  console.error("[github] Unexpected error:", err?.message);
  return sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
}

// ─── Stub data ────────────────────────────────────────────────────────────────

const STUB_REPOS = [
  {
    id: 1,
    name: "rkmmax-hibrido",
    fullName: "kizirianmax/rkmmax-hibrido",
    private: false,
    defaultBranch: "main",
    url: "https://github.com/kizirianmax/rkmmax-hibrido",
    description: "RKMMAX Híbrido — stub data (GITHUB_AUTH_MODE=stub)",
    updatedAt: new Date().toISOString(),
  },
];
