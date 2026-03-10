/**
 * GITHUB TYPES (JSDoc)
 *
 * Shared type definitions for the GitHub integration layer.
 * No runtime code — import only for JSDoc @typedef references.
 *
 * @module githubTypes
 */

/**
 * @typedef {Object} GithubRepo
 * @property {number}      id            - GitHub repository ID
 * @property {string}      name          - Repository name
 * @property {string}      fullName      - "owner/repo"
 * @property {boolean}     private       - Whether the repo is private
 * @property {string}      defaultBranch - Default branch name (e.g. "main")
 * @property {string}      url           - HTML URL (https://github.com/…)
 * @property {string|null} description   - Repository description, or null
 * @property {string}      updatedAt     - ISO 8601 last-updated timestamp
 */

/**
 * @typedef {Object} GithubBranch
 * @property {string}      name      - Branch name
 * @property {string|null} sha       - HEAD commit SHA
 * @property {boolean}     protected - Whether the branch is protected
 */

/**
 * @typedef {Object} GithubFileContent
 * @property {string}      name        - File name
 * @property {string}      path        - File path within the repo
 * @property {string}      sha         - Blob SHA (needed for updates)
 * @property {number}      size        - File size in bytes
 * @property {string}      encoding    - Always "base64" for GitHub API
 * @property {string}      content     - Base64-encoded file content
 * @property {string|null} downloadUrl - Raw download URL
 */

/**
 * @typedef {Object} GithubStatusResponse
 * @property {boolean}              enabled - Whether integration is enabled
 * @property {"stub"|"oauth"|"app"} mode    - Active auth mode
 * @property {string}               message - Human-readable status message
 */

/**
 * @typedef {Object} GithubPutFilePayload
 * @property {string}  message - Commit message
 * @property {string}  content - Base64-encoded file content
 * @property {string}  [sha]   - Required when updating an existing file
 * @property {string}  [branch] - Target branch (default: repo's default branch)
 */

/**
 * @typedef {Object} GithubCreatePRPayload
 * @property {string} title  - Pull request title
 * @property {string} head   - Source branch name
 * @property {string} base   - Target branch name
 * @property {string} [body] - Pull request description (markdown)
 */
