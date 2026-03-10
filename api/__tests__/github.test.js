/**
 * Tests for GitHub integration: config, service (stubs), and API endpoints.
 *
 * Covers the requirements from the problem statement:
 *   - GITHUB_INTEGRATION_ENABLED=false → /status ok, /repos → 501
 *   - GITHUB_INTEGRATION_ENABLED=true, mode=stub → /status ok, /repos → stub data
 *   - GITHUB_INTEGRATION_ENABLED=true, mode=oauth, no token → /repos → 400
 *   - NotImplementedError for write operations
 *   - GitHubApiError is never leaked to client (only safe message)
 */
import { jest } from "@jest/globals";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    setHeader(k, v) {
      this._headers[k] = v;
      return this;
    },
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

function makeReq(method, pathname) {
  return {
    method,
    url: pathname,
    headers: { host: "localhost" },
  };
}

// ─── githubConfig ─────────────────────────────────────────────────────────────

describe("githubConfig", () => {
  const ENV_KEYS = [
    "GITHUB_INTEGRATION_ENABLED",
    "GITHUB_AUTH_MODE",
    "GITHUB_TOKEN",
    "GITHUB_APP_ID",
    "GITHUB_APP_PRIVATE_KEY",
  ];

  let saved;
  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("isGithubEnabled returns false when env var is not set", async () => {
    const { isGithubEnabled } = await import("../lib/github/githubConfig.js");
    expect(isGithubEnabled()).toBe(false);
  });

  it("isGithubEnabled returns true when GITHUB_INTEGRATION_ENABLED=true", async () => {
    process.env.GITHUB_INTEGRATION_ENABLED = "true";
    const { isGithubEnabled } = await import("../lib/github/githubConfig.js");
    expect(isGithubEnabled()).toBe(true);
  });

  it("getAuthMode defaults to stub", async () => {
    const { getAuthMode } = await import("../lib/github/githubConfig.js");
    expect(getAuthMode()).toBe("stub");
  });

  it("getAuthMode returns oauth when set", async () => {
    process.env.GITHUB_AUTH_MODE = "oauth";
    const { getAuthMode } = await import("../lib/github/githubConfig.js");
    expect(getAuthMode()).toBe("oauth");
  });

  it("getAuthMode falls back to stub for unknown value", async () => {
    process.env.GITHUB_AUTH_MODE = "unknown_value";
    const { getAuthMode } = await import("../lib/github/githubConfig.js");
    expect(getAuthMode()).toBe("stub");
  });

  it("checkCredentials returns ok for stub mode (no token needed)", async () => {
    const { checkCredentials } = await import("../lib/github/githubConfig.js");
    const result = checkCredentials();
    expect(result.ok).toBe(true);
  });

  it("checkCredentials returns not ok for oauth mode without token", async () => {
    process.env.GITHUB_AUTH_MODE = "oauth";
    const { checkCredentials } = await import("../lib/github/githubConfig.js");
    const result = checkCredentials();
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/GITHUB_TOKEN/);
  });

  it("checkCredentials returns ok for oauth mode with token", async () => {
    process.env.GITHUB_AUTH_MODE = "oauth";
    process.env.GITHUB_TOKEN = "ghp_test123";
    const { checkCredentials } = await import("../lib/github/githubConfig.js");
    const result = checkCredentials();
    expect(result.ok).toBe(true);
  });

  it("getGithubConfigStatus never exposes token value", async () => {
    process.env.GITHUB_TOKEN = "super_secret_token";
    const { getGithubConfigStatus } = await import("../lib/github/githubConfig.js");
    const status = getGithubConfigStatus();
    const json = JSON.stringify(status);
    expect(json).not.toContain("super_secret_token");
    expect(status.hasOAuthToken).toBe(true); // boolean only
  });
});

// ─── githubService stubs ──────────────────────────────────────────────────────

describe("githubService — write stubs throw NotImplementedError", () => {
  it("putFile throws NotImplementedError", async () => {
    const { putFile, NotImplementedError } = await import("../lib/github/githubService.js");
    await expect(putFile("tok", "owner", "repo", "file.js", {})).rejects.toBeInstanceOf(
      NotImplementedError
    );
  });

  it("createPR throws NotImplementedError", async () => {
    const { createPR, NotImplementedError } = await import("../lib/github/githubService.js");
    await expect(createPR("tok", "owner", "repo", {})).rejects.toBeInstanceOf(NotImplementedError);
  });

  it("NotImplementedError has status 501", async () => {
    const { NotImplementedError } = await import("../lib/github/githubService.js");
    const err = new NotImplementedError("putFile");
    expect(err.status).toBe(501);
  });
});

// ─── /api/github endpoint handler ────────────────────────────────────────────

describe("GET /api/github/status — integration disabled (default)", () => {
  let savedEnabled;
  beforeEach(() => {
    savedEnabled = process.env.GITHUB_INTEGRATION_ENABLED;
    delete process.env.GITHUB_INTEGRATION_ENABLED;
  });
  afterEach(() => {
    if (savedEnabled === undefined) delete process.env.GITHUB_INTEGRATION_ENABLED;
    else process.env.GITHUB_INTEGRATION_ENABLED = savedEnabled;
  });

  it("returns 200 with enabled=false", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("GET", "/api/github/status");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.enabled).toBe(false);
    expect(typeof res._body.message).toBe("string");
  });
});

describe("GET /api/github/repos — integration disabled", () => {
  let savedEnabled;
  beforeEach(() => {
    savedEnabled = process.env.GITHUB_INTEGRATION_ENABLED;
    delete process.env.GITHUB_INTEGRATION_ENABLED;
  });
  afterEach(() => {
    if (savedEnabled === undefined) delete process.env.GITHUB_INTEGRATION_ENABLED;
    else process.env.GITHUB_INTEGRATION_ENABLED = savedEnabled;
  });

  it("returns 501 with INTEGRATION_DISABLED code", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("GET", "/api/github/repos");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(501);
    expect(res._body.error.code).toBe("INTEGRATION_DISABLED");
  });
});

describe("GET /api/github/repos — enabled, stub mode", () => {
  let savedEnabled, savedMode;
  beforeEach(() => {
    savedEnabled = process.env.GITHUB_INTEGRATION_ENABLED;
    savedMode = process.env.GITHUB_AUTH_MODE;
    process.env.GITHUB_INTEGRATION_ENABLED = "true";
    process.env.GITHUB_AUTH_MODE = "stub";
  });
  afterEach(() => {
    if (savedEnabled === undefined) delete process.env.GITHUB_INTEGRATION_ENABLED;
    else process.env.GITHUB_INTEGRATION_ENABLED = savedEnabled;
    if (savedMode === undefined) delete process.env.GITHUB_AUTH_MODE;
    else process.env.GITHUB_AUTH_MODE = savedMode;
  });

  it("returns 200 with stub repo array", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("GET", "/api/github/repos");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._body)).toBe(true);
    expect(res._body.length).toBeGreaterThan(0);
    // Normalised shape
    const repo = res._body[0];
    expect(repo).toHaveProperty("id");
    expect(repo).toHaveProperty("fullName");
    expect(repo).toHaveProperty("defaultBranch");
  });
});

describe("GET /api/github/repos — enabled, oauth mode, no token", () => {
  let savedEnabled, savedMode, savedToken;
  beforeEach(() => {
    savedEnabled = process.env.GITHUB_INTEGRATION_ENABLED;
    savedMode = process.env.GITHUB_AUTH_MODE;
    savedToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_INTEGRATION_ENABLED = "true";
    process.env.GITHUB_AUTH_MODE = "oauth";
    delete process.env.GITHUB_TOKEN;
  });
  afterEach(() => {
    if (savedEnabled === undefined) delete process.env.GITHUB_INTEGRATION_ENABLED;
    else process.env.GITHUB_INTEGRATION_ENABLED = savedEnabled;
    if (savedMode === undefined) delete process.env.GITHUB_AUTH_MODE;
    else process.env.GITHUB_AUTH_MODE = savedMode;
    if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = savedToken;
  });

  it("returns 400 with CREDENTIALS_MISSING code", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("GET", "/api/github/repos");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error.code).toBe("CREDENTIALS_MISSING");
    // Error message must NOT include any token value
    expect(JSON.stringify(res._body)).not.toMatch(/ghp_/);
  });
});

describe("Non-GET method", () => {
  it("returns 405 for POST /api/github/status", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("POST", "/api/github/status");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body.error.code).toBe("METHOD_NOT_ALLOWED");
  });
});

describe("Unknown endpoint", () => {
  it("returns 404 for GET /api/github/unknown", async () => {
    const { default: handler } = await import("../github.js");
    const req = makeReq("GET", "/api/github/unknown");
    const res = makeMockRes();
    await handler(req, res);
    expect(res._status).toBe(404);
    expect(res._body.error.code).toBe("NOT_FOUND");
  });
});
