import { validateWebContainerArtifact } from "./webcontainerArtifactContract.js";

const REQUIRED_FIELDS = ["id", "version", "entrypoint"];
const FORBIDDEN_FIELD_NAMES = new Set(["content", "contentPreview", "zipBase64", "user_email"]);
const FORBIDDEN_FIELD_PATTERNS = [/token/i, /secret/i];
const RESERVED_OUTPUT_FILES = new Set(["package.json", "artifact-manifest.json"]);

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

function hasForbiddenFieldName(fieldName) {
  return FORBIDDEN_FIELD_NAMES.has(fieldName) || FORBIDDEN_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}

function containsForbiddenSignals(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = containsForbiddenSignals(item);
      if (result) return result;
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (hasForbiddenFieldName(key)) {
      return key;
    }
    const nestedResult = containsForbiddenSignals(nestedValue);
    if (nestedResult) {
      return nestedResult;
    }
  }

  return null;
}

export function buildWebContainerCandidateFromConstructorArtifact(artifact) {
  if (!isPlainObject(artifact)) {
    return fail("artifact-invalido");
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof artifact[field] !== "string" || artifact[field].trim() !== artifact[field] || artifact[field].length === 0) {
      return fail("artifact-campo-obrigatorio-ausente", field);
    }
  }

  if (artifact.entrypoint !== "index.js") {
    return fail("entrypoint-nao-permitido", artifact.entrypoint);
  }

  if (!isPlainObject(artifact.manifest)) {
    return fail("manifest-invalido");
  }

  if (!isPlainObject(artifact.files)) {
    return fail("files-invalido");
  }

  const forbiddenField = containsForbiddenSignals(artifact);
  if (forbiddenField) {
    return fail("artifact-campo-proibido", forbiddenField);
  }

  const fileEntries = Object.entries(artifact.files);
  if (fileEntries.length === 0) {
    return fail("files-vazio");
  }

  if (!Object.prototype.hasOwnProperty.call(artifact.files, artifact.entrypoint)) {
    return fail("entrypoint-ausente-nos-files", artifact.entrypoint);
  }

  const candidate = {
    "package.json": `${JSON.stringify(
      {
        name: artifact.id,
        version: artifact.version,
        private: true,
        dependencies: {},
      },
      null,
      2
    )}\n`,
    "artifact-manifest.json": `${JSON.stringify(
      {
        id: artifact.id,
        version: artifact.version,
        entrypoint: artifact.entrypoint,
        ...artifact.manifest,
      },
      null,
      2
    )}\n`,
  };

  for (const [path, contents] of fileEntries) {
    if (RESERVED_OUTPUT_FILES.has(path)) {
      return fail("arquivo-reservado-em-files", path);
    }
    candidate[path] = contents;
  }

  const validation = validateWebContainerArtifact(candidate);
  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    candidate: validation.files,
  };
}
