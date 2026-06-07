import { mapConstructorStateToApprovedArtifactSource } from "./constructorApprovedArtifactSourceMapper.js";

const UNAVAILABLE_STATUS = "constructor-approved-artifact-memory-snapshot: unavailable";
const ELIGIBLE_STATUS = "constructor-approved-artifact-memory-snapshot: eligible";

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
    sourceType: "constructor-memory-client-safe-source",
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

function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function inspectForbiddenMemorySnapshot(value, path = "") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = inspectForbiddenMemorySnapshot(value[index], `${path}[${index}]`);
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
    if (/\bagentMessage\.content\b/i.test(value)) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: path || "value" };
    }
    if (/\b(?:token|secret|apiKey|password|authorization|bearer)\b/i.test(value)) {
      return { reason: "campo-sensivel-nao-permitido", path: path || "value" };
    }
    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;

    if (key === "agentMessage" && isPlainObject(nestedValue) && hasOwnProperty(nestedValue, "content")) {
      return { reason: "campo-agentmessage-content-nao-permitido", path: `${nextPath}.content` };
    }

    if (/^(content|contentPreview|zipBase64|user_email)$/i.test(key)) {
      return { reason: "payload-sensivel-nao-permitido", path: nextPath };
    }

    if (/^(rawPayload|payloadRaw|realPayload|payloadBruto)$/i.test(key)) {
      return { reason: "payload-bruto-nao-permitido", path: nextPath };
    }

    if (/^(token|secret|apiKey|password|authorization|bearer)$/i.test(key)) {
      return { reason: "campo-sensivel-nao-permitido", path: nextPath };
    }

    if (/^backend$/i.test(key)) {
      return { reason: "dependencia-backend-nao-permitida", path: nextPath };
    }

    if (/^executeArtifact$/i.test(key)) {
      return { reason: "execucao-server-side-nao-permitida", path: nextPath };
    }

    if (/^(sessionStorage|localStorage)$/i.test(key)) {
      return { reason: "fonte-storage-nao-permitida", path: nextPath };
    }

    const nested = inspectForbiddenMemorySnapshot(nestedValue, nextPath);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function buildSnapshot(input) {
  return {
    id: input.id,
    version: input.version,
    approval: input.approval,
    entrypoint: input.entrypoint,
    files: input.files,
    ...(input.manifest === undefined ? {} : { manifest: input.manifest }),
  };
}

export function buildConstructorApprovedArtifactMemorySnapshot(input) {
  if (!isPlainObject(input)) {
    return unavailable("constructor-memory-snapshot-invalido");
  }

  const forbidden = inspectForbiddenMemorySnapshot(input);
  if (forbidden) {
    return unavailable(forbidden.reason, forbidden.path);
  }

  const snapshot = buildSnapshot(input);
  const mapped = mapConstructorStateToApprovedArtifactSource(snapshot);

  if (!mapped.ok) {
    return unavailable(mapped.reason, mapped.path);
  }

  return eligible(mapped.artifact);
}
