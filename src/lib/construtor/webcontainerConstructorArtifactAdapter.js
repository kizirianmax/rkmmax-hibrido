import { validateArtifactPath } from "./webcontainerArtifactContract.js";

const FORBIDDEN_FIELD_PATTERNS = [
  /^content$/i,
  /^contentPreview$/i,
  /^zipBase64$/i,
  /^user_email$/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /password/i,
  /bearer/i,
];

const FORBIDDEN_FIELD_REASONS = {
  content: "campo-content-nao-permitido",
  contentpreview: "campo-contentpreview-nao-permitido",
  zipbase64: "campo-zipbase64-nao-permitido",
  user_email: "campo-user-email-nao-permitido",
};

function fail(reason, path) {
  return {
    ok: false,
    reason,
    ...(path ? { path } : {}),
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function forbiddenReasonForKey(key) {
  const normalized = String(key).toLowerCase();
  if (FORBIDDEN_FIELD_REASONS[normalized]) {
    return FORBIDDEN_FIELD_REASONS[normalized];
  }
  if (FORBIDDEN_FIELD_PATTERNS.some((pattern) => pattern.test(String(key)))) {
    return "campo-sensivel-nao-permitido";
  }
  return null;
}

function hasForbiddenFields(value, path = "") {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fullPath = path ? `${path}.${key}` : key;
    const forbiddenReason = forbiddenReasonForKey(key);
    if (forbiddenReason) {
      return fail(forbiddenReason, fullPath);
    }

    const nestedViolation = hasForbiddenFields(nestedValue, fullPath);
    if (nestedViolation) {
      return nestedViolation;
    }
  }

  return null;
}

function buildPackageJson(artifact) {
  return `${JSON.stringify(
    {
      name: "rkmmax-controlled-webcontainer-artifact",
      version: artifact.version,
      private: true,
      description: "Fixture controlado RKMMAX para execução client-side em WebContainer.",
      dependencies: {},
    },
    null,
    2
  )}\n`;
}

function buildArtifactManifest(artifact, filePaths) {
  const manifest = isPlainObject(artifact.manifest) ? artifact.manifest : {};
  return `${JSON.stringify(
    {
      ...manifest,
      id: artifact.id,
      version: artifact.version,
      contents: filePaths.map((path) => {
        if (path === "index.js") {
          return {
            path,
            description: "Entrypoint controlado do artefato mínimo.",
            type: "source",
          };
        }

        return {
          path,
          description: "Módulo local usado pelo entrypoint para validar execução multi-arquivo.",
          type: "source",
        };
      }),
    },
    null,
    2
  )}\n`;
}

export function buildWebContainerCandidateFromConstructorArtifact(artifact) {
  if (!isPlainObject(artifact)) {
    return fail("artefato-construtor-invalido");
  }

  const forbiddenField = hasForbiddenFields(artifact);
  if (forbiddenField) {
    return forbiddenField;
  }

  if (typeof artifact.id !== "string" || artifact.id.trim().length === 0) {
    return fail("artifact-id-invalido");
  }
  if (typeof artifact.version !== "string" || artifact.version.trim().length === 0) {
    return fail("artifact-version-invalido");
  }
  if (artifact.entrypoint !== "index.js") {
    return fail("entrypoint-nao-permitido");
  }
  if (!isPlainObject(artifact.files) || Object.keys(artifact.files).length === 0) {
    return fail("artifact-files-invalido");
  }

  const sourceEntries = Object.entries(artifact.files);
  for (const [path, contents] of sourceEntries) {
    const pathValidation = validateArtifactPath(path);
    if (!pathValidation.ok) {
      return pathValidation;
    }
    if (typeof contents !== "string") {
      return fail("conteudo-invalido", path);
    }
  }

  const sourceFiles = Object.fromEntries(sourceEntries);
  const candidate = {
    "package.json": buildPackageJson(artifact),
    "artifact-manifest.json": buildArtifactManifest(artifact, Object.keys(sourceFiles)),
    ...sourceFiles,
  };

  return {
    ok: true,
    candidate,
  };
}
