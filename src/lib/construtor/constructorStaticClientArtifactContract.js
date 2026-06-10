import { validateArtifactContent } from "./webcontainerArtifactContract.js";

const STATIC_REQUIRED_ENTRYPOINT = "index.html";
const STATIC_ALLOWED_FILES = new Set(["index.html", "styles.css", "style.css", "script.js"]);
const STATIC_ALLOWED_ASSET_FILE = /^assets\/[^/]+\.(?:css|js)$/;
const LOCKFILE_NAMES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);

function fail(reason, path) {
  return {
    ok: false,
    reason,
    ...(path ? { path } : {}),
  };
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isAllowedStaticPath(path) {
  return STATIC_ALLOWED_FILES.has(path) || STATIC_ALLOWED_ASSET_FILE.test(path);
}

function validateStaticClientArtifactPath(path) {
  if (typeof path !== "string" || path.trim() !== path || path.length === 0) {
    return fail("caminho-invalido");
  }

  if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    return fail("caminho-perigoso", path);
  }

  if (LOCKFILE_NAMES.has(path)) {
    return fail("lockfile-nao-permitido", path);
  }

  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment.startsWith("."))) {
    return fail("caminho-oculto-ou-invalido", path);
  }

  if (!isAllowedStaticPath(path)) {
    return fail("arquivo-fora-da-allowlist", path);
  }

  return { ok: true };
}

export function validateStaticClientArtifact(candidate) {
  if (!isPlainObject(candidate)) {
    return fail("artefato-invalido");
  }

  const entries = Object.entries(candidate);
  if (entries.length === 0) {
    return fail("artefato-sem-arquivos");
  }

  if (!Object.prototype.hasOwnProperty.call(candidate, STATIC_REQUIRED_ENTRYPOINT)) {
    return fail("entrypoint-nao-permitido", "entrypoint");
  }

  for (const [path, contents] of entries) {
    const pathValidation = validateStaticClientArtifactPath(path);
    if (!pathValidation.ok) {
      return pathValidation;
    }

    const contentValidation = validateArtifactContent(path, contents);
    if (!contentValidation.ok) {
      return contentValidation;
    }
  }

  return { ok: true, files: Object.fromEntries(entries) };
}
