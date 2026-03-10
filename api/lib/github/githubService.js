/**
 * GITHUB SERVICE
 *
 * High-level functions that call the GitHub REST API via githubClient.
 * This is the only file the rest of the backend should import.
 *
 * Write operations (putFile, createPR) are stubs that throw NotImplementedError
 * until the GitHub App auth flow is complete.
 *
 * TODO (Construtor N2/N3):
 *   1. Replace listRepos/listBranches stubs with real calls once auth is wired.
 *   2. Implement putFile once write scopes are confirmed.
 *   3. Implement createPR once putFile is stable.
 *   4. Add runBuild (trigger workflow_dispatch) as needed.
 */

import { githubFetch, GitHubApiError } from "./githubClient.js";

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
// See githubTypes.js for full type definitions.

// ─── Read operations ─────────────────────────────────────────────────────────

/**
 * Lists repositories accessible with the provided token.
 *
 * @param {string} token - OAuth or App installation token
 * @param {{ per_page?: number, page?: number }} [opts]
 * @returns {Promise<import('./githubTypes.js').GithubRepo[]>}
 */
export async function listRepos(token, opts = {}) {
  const { per_page = 30, page = 1 } = opts;
  const qs = new URLSearchParams({ per_page: String(per_page), page: String(page) });
  const raw = await githubFetch(`/user/repos?${qs}`, { token });
  return (raw || []).map(normaliseRepo);
}

/**
 * Lists branches for a repository.
 *
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<import('./githubTypes.js').GithubBranch[]>}
 */
export async function listBranches(token, owner, repo) {
  assertOwnerRepo(owner, repo);
  const raw = await githubFetch(`/repos/${owner}/${repo}/branches`, { token });
  return (raw || []).map(normaliseBranch);
}

/**
 * Reads a file from a repository.
 *
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} path   - File path within the repo (e.g. "src/index.js")
 * @param {string} [ref]  - Branch/tag/SHA (default: repo's default branch)
 * @returns {Promise<import('./githubTypes.js').GithubFileContent>}
 */
export async function getFile(token, owner, repo, path, ref) {
  assertOwnerRepo(owner, repo);
  assertPath(path);
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const raw = await githubFetch(`/repos/${owner}/${repo}/contents/${encodePath(path)}${qs}`, { token });
  return normaliseFileContent(raw);
}

// ─── Write operations (stubs) ─────────────────────────────────────────────────

/**
 * Creates or updates a file in a repository.
 * STUB — not yet implemented. Requires write scope and GitHub App auth.
 *
 * TODO: implement once GitHub App installation flow is complete.
 *
 * @param {string} _token
 * @param {string} _owner
 * @param {string} _repo
 * @param {string} _path
 * @param {object} _payload - { message, content (base64), sha? (required for update), branch? }
 * @throws {NotImplementedError}
 */
export async function putFile(_token, _owner, _repo, _path, _payload) {
  throw new NotImplementedError("putFile");
}

/**
 * Opens a pull request.
 * STUB — not yet implemented. Requires write scope and GitHub App auth.
 *
 * TODO: implement once putFile is stable.
 *
 * @param {string} _token
 * @param {string} _owner
 * @param {string} _repo
 * @param {object} _payload - { title, head, base, body? }
 * @throws {NotImplementedError}
 */
export async function createPR(_token, _owner, _repo, _payload) {
  throw new NotImplementedError("createPR");
}

// ─── Normalizers (keep response shape predictable) ────────────────────────────

/** @param {object} r */
function normaliseRepo(r) {
  return {
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    defaultBranch: r.default_branch,
    url: r.html_url,
    description: r.description || null,
    updatedAt: r.updated_at,
  };
}

/** @param {object} b */
function normaliseBranch(b) {
  return {
    name: b.name,
    sha: b.commit?.sha || null,
    protected: b.protected,
  };
}

/** @param {object} f */
function normaliseFileContent(f) {
  return {
    name: f.name,
    path: f.path,
    sha: f.sha,
    size: f.size,
    encoding: f.encoding,
    content: f.content, // base64-encoded by GitHub
    downloadUrl: f.download_url,
  };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertOwnerRepo(owner, repo) {
  if (!owner || typeof owner !== "string" || !/^[\w.-]+$/.test(owner)) {
    throw new GitHubApiError("Invalid owner parameter", 400, "");
  }
  if (!repo || typeof repo !== "string" || !/^[\w.-]+$/.test(repo)) {
    throw new GitHubApiError("Invalid repo parameter", 400, "");
  }
}

function assertPath(path) {
  if (!path || typeof path !== "string" || path.includes("..")) {
    throw new GitHubApiError("Invalid path parameter", 400, "");
  }
}

function encodePath(p) {
  return p
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class NotImplementedError extends Error {
  constructor(fn) {
    super(`${fn} is not yet implemented (TODO: GitHub App auth)`);
    this.name = "NotImplementedError";
    this.status = 501;
  }
}

export { GitHubApiError };
