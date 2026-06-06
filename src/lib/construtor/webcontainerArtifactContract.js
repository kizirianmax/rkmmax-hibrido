const ROOT_ALLOWED_FILES = new Set(["package.json", "artifact-manifest.json", "index.js"]);
const LOCKFILE_NAMES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const DANGEROUS_PACKAGE_SCRIPT_NAMES = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepack",
  "postpack",
  "prepare",
  "prepublish",
  "prepublishOnly",
]);
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "devependencies", "peerDependencies"];
const FORBIDDEN_CONTENT_PATTERNS = [
  { reason: "conteudo-com-url-ou-rede", pattern: /\b(?:https?|ftp|wss?):\/\//i },
  { reason: "conteudo-com-secret", pattern: /\b(?:token|secret|api[_-]?key|password|authorization|bearer)\b/i },
  { reason: "conteudo-com-user-email", pattern: /\buser_email\b/i },
  { reason: "conteudo-com-zipbase64", pattern: /\bzipBase64\b/ },
  { reason: "conteudo-com-contentpreview", pattern: /\bcontentPreview\b/ },
  { reason: "conteudo-com-payload-bruto", pattern: /\b(?:rawPayload|payloadRaw|realPayload|payload_bruto|payloadBruto)\b/i },
  { reason: "conteudo-com-comando-shell", pattern: /\b(?:child_process|execSync|spawnSync|execFileSync|rm\s+-rf|curl\s+|wget\s+|bash\s+-c|sh\s+-c)\b/i },
];

function fail(reason, path) {
  return {
    ok: false,
    reason,
    ...(path ? { path } : {}),
  };
}

function getCandidateFiles(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  if (candidate.files && typeof candidate.files === "object" && !Array.isArray(candidate.files)) {
    return candidate.files;
  }

  return candidate;
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function validateArtifactPath(path) {
  if (typeof path !== "string" || path.trim() !== path || path.length === 0) {
    return fail("caminho-invalido");
  }
  if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    return fail("caminho-perigoso", path);
  }

  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment.startsWith("."))) {
    return fail("caminho-oculto-ou-invalido", path);
  }
  if (LOCKFILE_NAMES.has(path)) {
    return fail("lockfile-nao-permitido", path);
  }
  if (ROOT_ALLOWED_FILES.has(path) || /^lib\/[^/]+\.js$/.test(path)) {
    return { ok: true };
  }

  return fail("arquivo-fora-da-allowlist", path);
}

export function validateArtifactContent(path, contents) {
  if (typeof contents !== "string") {
    return fail("conteudo-invalido", path);
  }

  for (const { reason, pattern } of FORBIDDEN_CONTENT_PATTERNS) {
    if (pattern.test(contents)) {
      return fail(reason, path);
    }
  }

  if (path !== "package.json") {
    return { ok: true };
  }

  let packageJson;
  try {
    packageJson = JSON.parse(contents);
  } catch {
    return fail("package-json-invalido", path);
  }

  if (!isPlainObject(packageJson)) {
    return fail("package-json-invalido", path);
  }

  for (const field of DEPENDENCY_FIELDS) {
    if (isPlainObject(packageJson[field]) && Object.keys(packageJson[field]).length > 0) {
      return fail("dependencias-externas-nao-permitidas", path);
    }
  }

  if (isPlainObject(packageJson.scripts)) {
    const scriptNames = Object.keys(packageJson.scripts);
    const dangerousScript = scriptNames.find((scriptName) => DANGEROUS_PACKAGE_SCRIPT_NAMES.has(scriptName));
    if (dangerousScript) {
      return fail("script-instalacao-nao-permitido", path);
    }
  }

  return { ok: true };
}

export function validateWebContainerArtifact(candidate) {
  const files = getCandidateFiles(candidate);
  if (!files) {
    return fail("artefato-invalido");
  }

  const entries = Object.entries(files);
  if (entries.length === 0) {
    return fail("artefato-sem-arquivos");
  }

  for (const [path, contents] of entries) {
    const pathValidation = validateArtifactPath(path);
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

export function normalizeWebContainerArtifact(files) {
  const mountTree = {};

  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split("/");
    let current = mountTree;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      current[segment] ||= { directory: {} };
      current = current[segment].directory;
    }

    current[segments[segments.length - 1]] = {
      file: {
        contents,
      },
    };
  }

  return mountTree;
}

export function sanitizeWebContainerArtifact(candidate) {
  const validation = validateWebContainerArtifact(candidate);
  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    files: validation.files,
    mountTree: normalizeWebContainerArtifact(validation.files),
  };
}
