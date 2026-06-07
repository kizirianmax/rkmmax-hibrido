import { validateArtifactContent, validateArtifactPath } from "./webcontainerArtifactContract.js";

const FORBIDDEN_FIELD_PATTERNS = [
  /^content$/i,
  /^contentPreview$/i,
  /^zipBase64$/i,
  /^user_email$/i,
  /^sessionStorage$/i,
  /^localStorage$/i,
  /^rawPayload$/i,
  /^payloadRaw$/i,
  /^realPayload$/i,
  /^payloadBruto$/i,
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
  sessionstorage: "fonte-storage-nao-permitida",
  localstorage: "fonte-storage-nao-permitida",
};

const DEPENDENCY_FIELDS = new Set([
  "dependencies",
  "devDependencies",
  "devependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "bundleDependencies",
]);

const CONTENT_TYPE = "application/vnd.rkmmax.constructor-approved-artifact+json";

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

function hasExternalDependencies(value, path = "") {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (DEPENDENCY_FIELDS.has(key)) {
      if (isPlainObject(nestedValue) && Object.keys(nestedValue).length > 0) {
        return fail("dependencias-externas-nao-permitidas", fullPath);
      }
      if (Array.isArray(nestedValue) && nestedValue.length > 0) {
        return fail("dependencias-externas-nao-permitidas", fullPath);
      }
    }

    const nestedViolation = hasExternalDependencies(nestedValue, fullPath);
    if (nestedViolation) {
      return nestedViolation;
    }
  }

  return null;
}

function hasForbiddenStringPayload(value, path = "") {
  if (typeof value === "string") {
    if (/\/api\//i.test(value) || /(?:https?|ftp|wss?):\/\//i.test(value)) {
      return fail("api-ou-rede-nao-permitida", path || "value");
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedViolation = hasForbiddenStringPayload(value[index], `${path}[${index}]`);
      if (nestedViolation) {
        return nestedViolation;
      }
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fullPath = path ? `${path}.${key}` : key;
    const nestedViolation = hasForbiddenStringPayload(nestedValue, fullPath);
    if (nestedViolation) {
      return nestedViolation;
    }
  }

  return null;
}

function normalizeManifest(manifest) {
  const origin = isPlainObject(manifest?.origin)
    ? {
        specialist: "hybrid",
        ...(typeof manifest.origin.model === "string" && manifest.origin.model.trim()
          ? { model: manifest.origin.model.trim() }
          : {}),
        ...(typeof manifest.origin.promptId === "string" && manifest.origin.promptId.trim()
          ? { promptId: manifest.origin.promptId.trim() }
          : {}),
      }
    : { specialist: "hybrid" };

  return {
    origin,
    contentType: CONTENT_TYPE,
  };
}

export function validateApprovedConstructorArtifact(candidate) {
  if (!isPlainObject(candidate)) {
    return fail("artefato-aprovado-invalido");
  }

  const forbiddenField = hasForbiddenFields(candidate);
  if (forbiddenField) {
    return forbiddenField;
  }

  const dependencyViolation = hasExternalDependencies(candidate.manifest, "manifest");
  if (dependencyViolation) {
    return dependencyViolation;
  }

  const forbiddenStringPayload = hasForbiddenStringPayload(candidate.manifest, "manifest");
  if (forbiddenStringPayload) {
    return forbiddenStringPayload;
  }

  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    return fail("artifact-id-invalido");
  }

  if (typeof candidate.version !== "string" || candidate.version.trim().length === 0) {
    return fail("artifact-version-invalido");
  }

  if (!isPlainObject(candidate.approval)) {
    return fail("artifact-approval-invalido");
  }

  if (candidate.approval.status !== "approved") {
    return fail("artifact-nao-aprovado");
  }

  if (candidate.entrypoint !== "index.js") {
    return fail("entrypoint-nao-permitido");
  }

  if (!isPlainObject(candidate.files) || Object.keys(candidate.files).length === 0) {
    return fail("artifact-files-invalido");
  }

  for (const [path, contents] of Object.entries(candidate.files)) {
    const pathValidation = validateArtifactPath(path);
    if (!pathValidation.ok) {
      return pathValidation;
    }

    const contentValidation = validateArtifactContent(path, contents);
    if (!contentValidation.ok) {
      return contentValidation;
    }

    if (typeof contents === "string" && (/\/api\//i.test(contents) || /\b(?:sessionStorage|localStorage)\b/i.test(contents))) {
      return fail("api-ou-storage-nao-permitido", path);
    }
  }

  return { ok: true };
}

export function normalizeApprovedConstructorArtifact(candidate) {
  const validation = validateApprovedConstructorArtifact(candidate);
  if (!validation.ok) {
    return validation;
  }

  const normalized = {
    id: candidate.id.trim(),
    version: candidate.version.trim(),
    approval: {
      status: "approved",
      source:
        typeof candidate.approval.source === "string" && candidate.approval.source.trim()
          ? candidate.approval.source.trim()
          : "constructor-human-review",
      ...(typeof candidate.approval.approvedAt === "string" && candidate.approval.approvedAt.trim()
        ? { approvedAt: candidate.approval.approvedAt.trim() }
        : {}),
    },
    entrypoint: "index.js",
    files: Object.fromEntries(Object.entries(candidate.files)),
    manifest: normalizeManifest(candidate.manifest),
  };

  return {
    ok: true,
    artifact: normalized,
  };
}

export function buildApprovedConstructorArtifactStatus(candidate) {
  const normalized = normalizeApprovedConstructorArtifact(candidate);

  if (!normalized.ok) {
    return {
      ok: false,
      status: "approved-constructor-artifact: invalid-contract",
      available: false,
      reason: normalized.reason,
      ...(normalized.path ? { path: normalized.path } : {}),
      source: "contract-only",
      rawPayloadAccessed: false,
      apiUsed: false,
      executeArtifactServerSide: "disabled",
      note: "Contrato definido; fonte real aprovada ainda indisponível no client.",
    };
  }

  return {
    ok: true,
    status: "approved-constructor-artifact: valid-contract",
    available: false,
    reason: "real-approved-source-still-unavailable",
    source: "contract-only",
    artifactId: normalized.artifact.id,
    artifactVersion: normalized.artifact.version,
    approvalStatus: normalized.artifact.approval.status,
    entrypoint: normalized.artifact.entrypoint,
    fileCount: Object.keys(normalized.artifact.files).length,
    contentType: normalized.artifact.manifest.contentType,
    rawPayloadAccessed: false,
    apiUsed: false,
    executeArtifactServerSide: "disabled",
    note: "Contrato definido; fonte real aprovada ainda indisponível no client.",
  };
}
