import { normalizeApprovedConstructorArtifact, validateApprovedConstructorArtifact } from "./approvedConstructorArtifactContract.js";

const UNAVAILABLE_STATUS = "approved-constructor-artifact-source: unavailable";
const ELIGIBLE_STATUS = "approved-constructor-artifact-source: eligible";

function unavailable(reason, path) {
  return {
    ok: false,
    status: UNAVAILABLE_STATUS,
    reason,
    ...(path ? { path } : {}),
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}

function eligible(artifact) {
  return {
    ok: true,
    status: ELIGIBLE_STATUS,
    sourceType: "client-safe-approved-source",
    artifact,
    rawPayloadAccessed: false,
    apiUsed: false,
    storageUsed: false,
    executeArtifactServerSide: "disabled",
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function findForbiddenPayload(value, path = "") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = findForbiddenPayload(value[index], `${path}[${index}]`);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (typeof value === "string") {
    if (/\/api\//i.test(value)) {
      return { reason: "api-ou-rede-nao-permitida", path: path || "value" };
    }
    if (/\b(?:sessionStorage|localStorage)\b/i.test(value)) {
      return { reason: "fonte-storage-nao-permitida", path: path || "value" };
    }
    if (/\bbackend\b/i.test(value)) {
      return { reason: "dependencia-backend-nao-permitida", path: path || "value" };
    }
    if (/\bexecuteArtifact\b/i.test(value)) {
      return { reason: "execucao-server-side-nao-permitida", path: path || "value" };
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (key === "agentMessage" && isPlainObject(nestedValue) && typeof nestedValue.content === "string") {
      return { reason: "campo-agentmessage-content-nao-permitido", path: `${nextPath}.content` };
    }

    const nested = findForbiddenPayload(nestedValue, nextPath);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function inspectApprovedConstructorArtifactSource(source) {
  if (!isPlainObject(source)) {
    return unavailable("fonte-aprovada-invalida");
  }

  const forbiddenPayload = findForbiddenPayload(source);
  if (forbiddenPayload) {
    return unavailable(forbiddenPayload.reason, forbiddenPayload.path);
  }

  const validation = validateApprovedConstructorArtifact(source);
  if (!validation.ok) {
    return unavailable(validation.reason, validation.path);
  }

  return eligible(source);
}

export function buildApprovedConstructorArtifactFromSource(source) {
  const inspection = inspectApprovedConstructorArtifactSource(source);
  if (!inspection.ok) {
    return inspection;
  }

  const normalized = normalizeApprovedConstructorArtifact(inspection.artifact);
  if (!normalized.ok) {
    return unavailable(normalized.reason, normalized.path);
  }

  return eligible(normalized.artifact);
}
